import { BoardSystem } from "./boardsystem.js"
import { Troop } from "../Entidades/troop.js"
import { EnemyAI } from "../AI/enemyAI.js"
import { cardsData } from "../Data/cardsdata.js"

export class CombatSystem {

    constructor(game) {
        this.game = game
        this.board = new BoardSystem()

        this.playerHealth = 30
        this.enemyHealth = 30

        this.playerEnergy = 5
        this.enemyEnergy = 5
        this.maxEnergy = 10

        this.attackLimit = 3
        this.attacksUsed = 0

        this.selectedAttacker = null
        this.selectedCardIndex = null      // carta seleccionada de la mano para colocar
        this.pendingHealTarget = null
        this.pendingSpell = null           // hechizo pendiente de objetivo
        this.pendingSacrificeAlly = null   // sacrificio: primero elige aliado
        this.pendingSacrificeEnemy = false // sacrificio: luego elige enemigo

        this.turn = 1
        this.phase = "play"
        this.gameOver = false
        this.logs = []

        this.playerHand = []
        this.enemyHand = []
        this.playerDeck = []
        this.enemyDeck = []

        this.previewCard = null            // carta en preview (click derecho)
    }

    startCombat() {
        this.log("⚔️ Comienza el combate")
        this.playerDeck = this._buildDeck("player")
        this.enemyDeck = this._buildDeck("enemy")
        for (let i = 0; i < 5; i++) this._drawCard("player")
        for (let i = 0; i < 5; i++) this._drawCard("enemy")
        this.render()
    }

    _buildDeck(side) {
        const all = Object.values(cardsData)
        let pool
        if (side === "player") {
            pool = all
        } else {
            const level = this.game?.runManager?.level || 1
            pool = EnemyAI.getEnemyDeck(level)
        }
        return [...pool].sort(() => Math.random() - 0.5)
    }

    _drawCard(side) {
        if (side === "player") {
            if (this.playerDeck.length === 0) return
            const card = this.playerDeck.shift()
            if (this.playerHand.length < 7) this.playerHand.push(card)
        } else {
            if (this.enemyDeck.length === 0) return
            const card = this.enemyDeck.shift()
            if (this.enemyHand.length < 7) this.enemyHand.push(card)
        }
    }

    startTurn() {
        if (this.gameOver) return
        this.turn++
        this.phase = "play"
        this.attacksUsed = 0
        this.selectedAttacker = null
        this.selectedCardIndex = null
        this.pendingSpell = null
        this.pendingSacrificeAlly = null
        this.pendingSacrificeEnemy = false

        this.playerEnergy = Math.min(this.playerEnergy + 3, this.maxEnergy)
        this.enemyEnergy = Math.min(this.enemyEnergy + 3, this.maxEnergy)

        this._drawCard("player")
        this._drawCard("enemy")

        this._startTroopTurns("player")
        this._startTroopTurns("enemy")

        const dead = this.board.removeDead()
        this._applyDeathEffects(dead)
        this._checkGameOver()

        this.log(`── Turno ${this.turn} ──`)
        this.render()
    }

    _startTroopTurns(side) {
        ;["melee", "ranged"].forEach(row => {
            this.board.board[side][row].forEach(t => {
                if (t) t.startTurn(this.board, this)
            })
        })
    }

    // ── Selección de carta de la mano ──
    selectCard(index) {
        if (this.gameOver || this.phase === "enemy") return
        if (this.pendingHealTarget || this.pendingSpell || this.pendingSacrificeAlly || this.pendingSacrificeEnemy) return

        const card = this.playerHand[index]
        if (!card) return
        if (card.cost > this.playerEnergy) {
            this.log("❌ Energía insuficiente")
            this.render()
            return
        }

        // Hechizos sin objetivo (efecto global)
        if (card.type === "spell") {
            this._handleSpellPlay(index)
            return
        }

        // Tropa: seleccionar para colocar en tablero
        if (this.selectedCardIndex === index) {
            this.selectedCardIndex = null
        } else {
            this.selectedCardIndex = index
            this.selectedAttacker = null
            this.log(`🃏 Elegí un slot ${card.subtype === "ranged" ? "RANGED" : "MELEE"} para invocar ${card.name}`)
        }
        this.render()
    }

    // Click en slot del tablero del jugador para colocar tropa
    placeCardInSlot(row, col) {
        if (this.selectedCardIndex === null) return
        const card = this.playerHand[this.selectedCardIndex]
        if (!card || card.type !== "troop") return

        const expectedRow = card.subtype === "ranged" ? "ranged" : "melee"
        if (row !== expectedRow) {
            this.log(`❌ ${card.name} debe ir en fila ${expectedRow.toUpperCase()}`)
            this.render()
            return
        }
        if (this.board.board.player[row][col] !== null) {
            this.log("❌ Ese slot ya está ocupado")
            this.render()
            return
        }

        const troop = new Troop(card, "player")
        // Colocar en columna específica
        this.board.board.player[row][col] = troop
        troop.col = col

        this.playerEnergy -= card.cost
        this.playerHand.splice(this.selectedCardIndex, 1)
        this.selectedCardIndex = null

        this.log(`✅ Invocaste ${troop.name} en ${row.toUpperCase()} col ${col + 1}`)

        // Efectos al entrar al campo
        this._applyOnPlayEffects(troop, card)

        const dead = this.board.removeDead()
        this._applyDeathEffects(dead)
        this._checkGameOver()
        this.render()
    }

    _applyOnPlayEffects(troop, card) {
        if (!card.effect) return

        // chargeAttack: Bestia Frenética
        if (card.effect.type === "chargeAttack") {
            const target = this.board.getTroop("enemy", "melee", troop.col)
            if (target) {
                const leaderRef = { health: this.enemyHealth }
                troop.attackTarget(target, this, leaderRef)
                this.log(`🐾 ${troop.name} ataca inmediatamente a ${target.name}`)
                troop.hasAttacked = false // no consume el ataque del turno
            } else {
                this.enemyHealth -= troop.attack
                this.log(`🐾 ${troop.name} ataca al líder enemigo: -${troop.attack} HP`)
            }
        }

        // shieldAllyOnPlay: Escudero Leal
        if (card.effect.type === "shieldAllyOnPlay") {
            const rangedAlly = this.board.getTroop("player", "ranged", troop.col)
            if (rangedAlly) {
                rangedAlly.health += card.effect.healthBonus
                this.log(`🛡️ ${troop.name} otorga +${card.effect.healthBonus} HP a ${rangedAlly.name}`)
            }
        }

        // healAllyOnPlay: Sacerdote Oscuro
        if (card.effect.type === "healAllyOnPlay") {
            const allies = this.board.getTroops("player").filter(({ troop: t }) => t !== troop)
            if (allies.length > 0) {
                this.pendingHealTarget = { amount: card.effect.healAmount }
                this.log(`💚 Elegí una tropa aliada para curar (+${card.effect.healAmount} HP)`)
            }
        }

        // summonSpecterEachTurn: invoca un espectro al entrar
        if (card.effect.type === "summonSpecterEachTurn") {
            troop._summonSpecter(this.board, this)
        }
    }

    // ── Hechizos ──
    _handleSpellPlay(index) {
        const card = this.playerHand[index]
        const effect = card.effect

        // Efectos globales sin objetivo
        if (effect.type === "buffAllAllies") {
            this.board.getTroops("player").forEach(({ troop }) => {
                troop.attack += effect.attackBonus
            })
            this.playerEnergy -= card.cost
            this.playerHand.splice(index, 1)
            this.log(`⚔️ Furia de Guerra: todas las tropas aliadas ganan +${effect.attackBonus} ATK`)
            this.render()
            return
        }

        if (effect.type === "damageAllEnemies") {
            this.board.getTroops("enemy").forEach(({ troop }) => {
                troop.takeDamage(effect.damage, this)
            })
            this.playerEnergy -= card.cost
            this.playerHand.splice(index, 1)
            const dead = this.board.removeDead()
            this._applyDeathEffects(dead)
            this._checkGameOver()
            this.log(`🌩️ Tormenta de Sombras: ${effect.damage} daño a todos los enemigos`)
            this.render()
            return
        }

        // Hechizos con objetivo aliado
        if (effect.type === "healAlly") {
            if (this.board.getTroops("player").length === 0) {
                this.log("❌ No hay tropas aliadas")
                this.render()
                return
            }
            this.pendingSpell = { cardIndex: index, card }
            this.log(`💙 Elegí una tropa aliada para aplicar ${card.name}`)
            this.render()
            return
        }

        // Hechizos con objetivo enemigo
        if (effect.type === "curseEnemy") {
            if (this.board.getTroops("enemy").length === 0) {
                this.log("❌ No hay tropas enemigas")
                this.render()
                return
            }
            this.pendingSpell = { cardIndex: index, card }
            this.log(`💜 Elegí una tropa enemiga para aplicar ${card.name}`)
            this.render()
            return
        }

        // Sacrificio de Almas: primero elige aliado
        if (effect.type === "sacrificeTrade") {
            const allies = this.board.getTroops("player")
            const enemies = this.board.getTroops("enemy")
            if (allies.length === 0 || enemies.length === 0) {
                this.log("❌ Necesitás tropas aliadas y enemigas")
                this.render()
                return
            }
            this.pendingSacrificeAlly = { cardIndex: index, card }
            this.log(`💀 Elegí una tropa ALIADA para sacrificar`)
            this.render()
            return
        }
    }

    applySpellToTarget(side, row, col) {
        // Sacrificio: elegir aliado
        if (this.pendingSacrificeAlly && side === "player") {
            const ally = this.board.getTroop("player", row, col)
            if (!ally) return
            this.pendingSacrificeEnemy = { allyRow: row, allyCol: col, card: this.pendingSacrificeAlly.card, cardIndex: this.pendingSacrificeAlly.cardIndex }
            this.pendingSacrificeAlly = null
            this.log(`💀 ${ally.name} será sacrificado. Ahora elegí una tropa ENEMIGA`)
            this.render()
            return
        }

        // Sacrificio: elegir enemigo
        if (this.pendingSacrificeEnemy && side === "enemy") {
            const enemy = this.board.getTroop("enemy", row, col)
            if (!enemy) return
            const { allyRow, allyCol, card, cardIndex } = this.pendingSacrificeEnemy

            // destruir ambos
            const ally = this.board.getTroop("player", allyRow, allyCol)
            if (ally) {
                this.log(`💀 ${ally.name} es sacrificado y ${enemy.name} es destruido`)
                ally.health = 0
                enemy.health = 0
            }
            this.playerEnergy -= card.cost
            this.playerHand.splice(cardIndex, 1)
            this.pendingSacrificeEnemy = false
            const dead = this.board.removeDead()
            this._applyDeathEffects(dead)
            this._checkGameOver()
            this.render()
            return
        }

        if (!this.pendingSpell) return
        const { cardIndex, card } = this.pendingSpell
        const effect = card.effect
        const target = this.board.getTroop(side, row, col)
        if (!target) return

        if (effect.type === "healAlly" && side === "player") {
            target.heal(effect.amount)
            this.log(`💙 ${card.name}: ${target.name} recupera +${effect.amount} HP. HP: ${target.health}`)
            this.playerEnergy -= card.cost
            this.playerHand.splice(cardIndex, 1)
            this.pendingSpell = null
        }

        if (effect.type === "curseEnemy" && side === "enemy") {
            target.applyCurse(effect.damagePerTurn, effect.duration)
            this.log(`💜 ${card.name}: ${target.name} maldito por ${effect.duration} turnos`)
            this.playerEnergy -= card.cost
            this.playerHand.splice(cardIndex, 1)
            this.pendingSpell = null
        }

        this.render()
    }

    healAllyTarget(row, col) {
        if (!this.pendingHealTarget) return
        const target = this.board.getTroop("player", row, col)
        if (!target) return
        target.heal(this.pendingHealTarget.amount)
        this.log(`💚 ${target.name} recupera ${this.pendingHealTarget.amount} HP. HP: ${target.health}`)
        this.pendingHealTarget = null
        this.render()
    }

    selectAttacker(row, col) {
        if (this.gameOver) return
        if (this.attacksUsed >= this.attackLimit) return
        if (this.pendingHealTarget || this.pendingSpell || this.selectedCardIndex !== null || this.pendingSacrificeAlly || this.pendingSacrificeEnemy) return
        const troop = this.board.getTroop("player", row, col)
        if (!troop || !troop.canAttack()) return
        this.selectedAttacker = { row, col, troop }
        this.log(`🎯 Seleccionaste: ${troop.name}`)
        this.render()
    }

    attackTarget(row, col) {
        if (!this.selectedAttacker) return
        if (this.attacksUsed >= this.attackLimit) return

        const attacker = this.selectedAttacker.troop
        const attackerCol = this.selectedAttacker.col
        const defender = this.board.getTroop("enemy", row, col)

        if (attacker.type === "melee" && !(attacker.effect && attacker.effect.type === "doubleColumnAttack")) {
            if (col !== attackerCol) {
                this.log("❌ Melee solo puede atacar su columna")
                this.render()
                return
            }
        }

        if (attacker.effect && attacker.effect.type === "doubleColumnAttack") {
            this._resolveGuardianAttack(attacker, attackerCol, row, col)
            return
        }

        if (defender) {
            const leaderRef = { health: this.enemyHealth }
            attacker.attackTarget(defender, this, leaderRef)
            if (attacker.effect && attacker.effect.type === "excessDamageToLeader") {
                this.enemyHealth = leaderRef.health
            }
        } else {
            this.enemyHealth -= attacker.attack
            attacker.hasAttacked = true
            this.log(`⚔️ ${attacker.name} ataca al líder enemigo: -${attacker.attack} HP`)
        }

        this._finishAttack()
    }

    attackEnemyLeaderDirect() {
        if (!this.selectedAttacker) return
        if (this.attacksUsed >= this.attackLimit) return
        if (this.gameOver) return
        const attacker = this.selectedAttacker.troop
        this.enemyHealth -= attacker.attack
        attacker.hasAttacked = true
        this.log(`⚔️ ${attacker.name} ataca al líder enemigo: -${attacker.attack} HP`)
        this._finishAttack()
    }

    _resolveGuardianAttack(attacker, attackerCol, row, col) {
        const mainTarget = this.board.getTroop("enemy", "melee", attackerCol)
        if (mainTarget) {
            mainTarget.takeDamage(attacker.attack, this)
            this.log(`⚔️ ${attacker.name} golpea a ${mainTarget.name}`)
        } else {
            this.enemyHealth -= attacker.attack
            this.log(`⚔️ ${attacker.name} golpea al líder`)
        }
        const adjCols = this.board.getAdjacentCols(attackerCol)
        if (adjCols.includes(col) && col !== attackerCol) {
            const adjTarget = this.board.getTroop("enemy", "melee", col)
            if (adjTarget) {
                adjTarget.takeDamage(attacker.attack, this)
                this.log(`🌀 ${attacker.name} golpea también a ${adjTarget.name}`)
            }
        }
        attacker.hasAttacked = true
        this._finishAttack()
    }

    _finishAttack() {
        this.attacksUsed++
        this.selectedAttacker = null
        const dead = this.board.removeDead()
        this._applyDeathEffects(dead)
        this._checkGameOver()
        this.render()
    }

    _applyDeathEffects(deadList) {
        if (deadList.length === 0) return
        ;["player", "enemy"].forEach(side => {
            ;["melee", "ranged"].forEach(row => {
                this.board.board[side][row].forEach(t => {
                    if (t && t.effect && t.effect.type === "scavengerOnDeath") {
                        t.health += t.effect.healthGain * deadList.length
                        this.log(`🦅 ${t.name} gana +${t.effect.healthGain * deadList.length} HP`)
                    }
                })
            })
        })
    }

    endTurn() {
        if (this.gameOver) return
        if (this.pendingHealTarget) {
            this.log("❌ Debés elegir un objetivo para el Sacerdote Oscuro")
            this.render()
            return
        }
        if (this.pendingSpell) {
            this.log("❌ Debés elegir un objetivo para el hechizo")
            this.render()
            return
        }
        if (this.pendingSacrificeAlly || this.pendingSacrificeEnemy) {
            this.log("❌ Debés completar el Sacrificio de Almas")
            this.render()
            return
        }

        const possible = this._countPossibleAttacks()
        const unused = Math.max(0, possible - this.attacksUsed)
        const bonus = Math.min(unused, 2)
        if (bonus > 0) {
            this.playerEnergy = Math.min(this.playerEnergy + bonus, this.maxEnergy)
            this.log(`⚡ Bonus energía: +${bonus}`)
        }
        this.phase = "enemy"
        this.selectedAttacker = null
        this.selectedCardIndex = null
        this.log("── Turno del enemigo ──")
        this.render()
        setTimeout(() => { this._enemyTurn() }, 700)
    }

    _enemyTurn() {
        if (this.gameOver) return
        EnemyAI.playTurn(this)
        this._checkGameOver()
        if (this.gameOver) return
        setTimeout(() => { this.startTurn() }, 900)
    }

    _countPossibleAttacks() {
        let count = 0
        ;["melee", "ranged"].forEach(row => {
            this.board.board.player[row].forEach(t => {
                if (t && t.canAttack()) count++
            })
        })
        return Math.min(count, this.attackLimit)
    }

    _checkGameOver() {
        if (this.enemyHealth <= 0) {
            this.gameOver = true
            this.log("🏆 ¡VICTORIA!")
            this.render()
        } else if (this.playerHealth <= 0) {
            this.gameOver = true
            this.log("💀 DERROTA. Run terminada.")
            this.render()
        }
    }

    showPreview(card) {
        this.previewCard = card
        this.render()
    }

    hidePreview() {
        this.previewCard = null
        this.render()
    }

    log(msg) {
        this.logs.unshift(msg)
        if (this.logs.length > 20) this.logs.pop()
    }

    // ─── RENDER ───────────────────────────────────────────────────────────────

    render() {
        const app = document.getElementById("app")
        if (!app) return

        const selId = this.selectedAttacker
            ? `${this.selectedAttacker.row}-${this.selectedAttacker.col}`
            : null

        const healMode = !!this.pendingHealTarget
        const spellMode = !!this.pendingSpell
        const sacrificeAllyMode = !!this.pendingSacrificeAlly
        const sacrificeEnemyMode = !!this.pendingSacrificeEnemy
        const placingCard = this.selectedCardIndex !== null ? this.playerHand[this.selectedCardIndex] : null

        app.innerHTML = `
        <div class="game-wrapper">

            <!-- PANEL IZQUIERDO: LOG -->
            <div class="side-panel left-panel">
                <div class="panel-title">📜 REGISTRO</div>
                <div class="log-section">
                    ${this.logs.slice(0, 15).map(l => `<div class="log-line">${l}</div>`).join("")}
                </div>
            </div>

            <!-- CENTRO: CAMPO DE BATALLA -->
            <div class="center-panel">

                <!-- Barra enemigo -->
                <div class="leader-bar enemy-bar">
                    <span class="leader-label">👹 ENEMIGO</span>
                    <span class="leader-hp ${this.enemyHealth <= 10 ? 'hp-low' : ''}">❤️ ${this.enemyHealth}</span>
                    <span class="energy-display">⚡ ${this.enemyEnergy}/${this.maxEnergy}</span>
                </div>

                <!-- Tablero enemigo -->
                <div class="battlefield">
                    ${this._renderRow("enemy", "ranged", selId, healMode, spellMode, sacrificeAllyMode, sacrificeEnemyMode, placingCard)}
                    ${this._renderRow("enemy", "melee", selId, healMode, spellMode, sacrificeAllyMode, sacrificeEnemyMode, placingCard)}
                </div>

                <!-- Divisor -->
                <div class="divider">
                    <button class="btn-leader ${this.selectedAttacker ? 'btn-active' : ''}"
                        onclick="window.game.combatSystem.attackEnemyLeaderDirect()">
                        ⚡ Atacar Líder
                    </button>
                </div>

                <!-- Tablero jugador -->
                <div class="battlefield">
                    ${this._renderRow("player", "melee", selId, healMode, spellMode, sacrificeAllyMode, sacrificeEnemyMode, placingCard)}
                    ${this._renderRow("player", "ranged", selId, healMode, spellMode, sacrificeAllyMode, sacrificeEnemyMode, placingCard)}
                </div>

                <!-- Barra jugador -->
                <div class="leader-bar player-bar">
                    <span class="leader-label">🧙 JUGADOR</span>
                    <span class="leader-hp ${this.playerHealth <= 10 ? 'hp-low' : ''}">❤️ ${this.playerHealth}</span>
                    <span class="energy-display">⚡ ${this.playerEnergy}/${this.maxEnergy}</span>
                    <span class="attack-display">⚔️ ${this.attacksUsed}/${this.attackLimit}</span>
                    <span class="turn-display">Turno ${this.turn}</span>
                    <div style="margin-left:auto">
                        ${this.phase !== "enemy" ? `
                            <button class="btn-end" onclick="window.game.combatSystem.endTurn()">
                                Fin de Turno →
                            </button>
                        ` : `<span class="enemy-turn-label">⏳ Turno enemigo...</span>`}
                    </div>
                </div>

                <!-- Mano -->
                <div class="hand-section">
                    <div class="hand-label">MANO (${this.playerHand.length}/7)</div>
                    <div class="hand">
                        ${this.playerHand.map((card, i) => this._renderCard(card, i)).join("")}
                    </div>
                </div>

            </div>

            <!-- PANEL DERECHO: INFO -->
            <div class="side-panel right-panel">
                <div class="panel-title">📖 INFO</div>
                <div class="info-content">
                    ${placingCard ? `
                        <div class="info-hint placing">
                            🃏 Colocando:<br><strong>${placingCard.name}</strong><br>
                            <span style="color:var(--text-dim);font-size:0.75rem">Clickeá un slot ${placingCard.subtype === "ranged" ? "RANGED" : "MELEE"} libre</span>
                        </div>
                    ` : ""}
                    ${this.selectedAttacker ? `
                        <div class="info-hint attacking">
                            ⚔️ Atacando con:<br><strong>${this.selectedAttacker.troop.name}</strong><br>
                            <span style="color:var(--text-dim);font-size:0.75rem">Clickeá un enemigo o el líder</span>
                        </div>
                    ` : ""}
                    ${healMode ? `<div class="info-hint heal">💚 Elegí una tropa aliada para curar</div>` : ""}
                    ${spellMode ? `<div class="info-hint spell">✨ Elegí objetivo para el hechizo</div>` : ""}
                    ${sacrificeAllyMode ? `<div class="info-hint sacrifice">💀 Elegí tropa ALIADA a sacrificar</div>` : ""}
                    ${sacrificeEnemyMode ? `<div class="info-hint sacrifice">💀 Elegí tropa ENEMIGA a destruir</div>` : ""}
                    <div class="info-hint neutral" style="margin-top:auto">
                        <strong style="color:var(--gold)">🖱️ Controles</strong><br>
                        <span style="color:var(--text-dim);font-size:0.72rem">
                            Click izq: seleccionar<br>
                            Click der: ver habilidad<br>
                            ESC: cancelar
                        </span>
                    </div>
                </div>
            </div>

        </div>

        <!-- Preview de carta (click derecho) -->
        ${this.previewCard ? this._renderPreviewModal(this.previewCard) : ""}

        <!-- Game Over -->
        ${this.gameOver ? `
            <div class="game-over-overlay">
                <div class="game-over-box">
                    <div class="game-over-title">
                        ${this.enemyHealth <= 0 ? "🏆 VICTORIA" : "💀 DERROTA"}
                    </div>
                    <button class="btn-restart" onclick="location.reload()">Reiniciar</button>
                </div>
            </div>
        ` : ""}
        `

        // ESC para cancelar selecciones
        document.onkeydown = (e) => {
            if (e.key === "Escape") {
                this.selectedCardIndex = null
                this.selectedAttacker = null
                this.pendingSpell = null
                this.pendingSacrificeAlly = null
                this.pendingSacrificeEnemy = false
                this.previewCard = null
                this.render()
            }
        }

        // Cerrar preview al clickear fuera
        const overlay = document.getElementById("preview-overlay")
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.previewCard = null
                    this.render()
                }
            }
        }
    }

    _renderPreviewModal(card) {
        const isSpell = card.type === "spell"
        return `
        <div class="preview-overlay" id="preview-overlay">
            <div class="preview-modal">
                <div class="preview-cost">⚡${card.cost}</div>
                <div class="preview-name">${card.name}</div>
                <div class="preview-type">${isSpell ? "✨ Hechizo" : card.subtype === "ranged" ? "🏹 A Distancia" : "⚔️ Cuerpo a Cuerpo"}</div>
                ${!isSpell ? `
                    <div class="preview-stats">
                        <span class="preview-atk">⚔ ${card.attack}</span>
                        <span class="preview-hp">❤ ${card.health}</span>
                    </div>
                ` : ""}
                <div class="preview-effect">${card.effectDescription || "Sin habilidad especial."}</div>
                <button class="preview-close" onclick="window.game.combatSystem.hidePreview()">✕ Cerrar</button>
            </div>
        </div>`
    }

    _renderRow(side, row, selId, healMode, spellMode, sacrificeAllyMode, sacrificeEnemyMode, placingCard) {
        const cells = this.board.board[side][row]
        const rowLabel = row === "melee" ? "MELEE" : "RANGED"

        return `
        <div class="board-row">
            <div class="row-label">${rowLabel}</div>
            ${cells.map((troop, col) => {
                const cellId = `${row}-${col}`
                const isSelected = selId === cellId && side === "player"
                const isAttackable = !!this.selectedAttacker && side === "enemy" && !!troop
                const isHealable = healMode && side === "player" && !!troop
                const isSpellTarget = spellMode && (
                    (this.pendingSpell?.card?.effect?.type === "healAlly" && side === "player" && !!troop) ||
                    (this.pendingSpell?.card?.effect?.type === "curseEnemy" && side === "enemy" && !!troop)
                )
                const isSacrificeAlly = sacrificeAllyMode && side === "player" && !!troop
                const isSacrificeEnemy = sacrificeEnemyMode && side === "enemy" && !!troop

                // Slots vacíos del jugador: resaltar si se está colocando una tropa
                const isPlaceable = placingCard && side === "player" && !troop &&
                    ((placingCard.subtype === "ranged" && row === "ranged") ||
                     (placingCard.subtype !== "ranged" && row === "melee"))

                let clickFn = ""

                if (isPlaceable) {
                    clickFn = `onclick="window.game.combatSystem.placeCardInSlot('${row}',${col})"`
                } else if (side === "player" && troop && !healMode && !spellMode && !sacrificeAllyMode && !isSacrificeEnemy && !placingCard) {
                    clickFn = `onclick="window.game.combatSystem.selectAttacker('${row}',${col})"`
                } else if (side === "player" && troop && healMode) {
                    clickFn = `onclick="window.game.combatSystem.healAllyTarget('${row}',${col})"`
                } else if (isSpellTarget || isSacrificeAlly || isSacrificeEnemy) {
                    clickFn = `onclick="window.game.combatSystem.applySpellToTarget('${side}','${row}',${col})"`
                } else if (side === "enemy" && this.selectedAttacker) {
                    clickFn = `onclick="window.game.combatSystem.attackTarget('${row}',${col})"`
                }

                const rightClickFn = troop
                    ? `oncontextmenu="event.preventDefault(); window.game.combatSystem.showPreview(window._troopCardRef('${troop.id}', '${side}', '${row}', ${col}))"`
                    : ""

                return `
                <div class="cell
                    ${troop ? "cell-filled" : "cell-empty"}
                    ${isSelected ? "cell-selected" : ""}
                    ${isAttackable ? "cell-attackable" : ""}
                    ${isHealable ? "cell-healable" : ""}
                    ${isSpellTarget ? "cell-spell-target" : ""}
                    ${isSacrificeAlly ? "cell-sacrifice" : ""}
                    ${isSacrificeEnemy ? "cell-sacrifice-enemy" : ""}
                    ${isPlaceable ? "cell-placeable" : ""}
                    ${side === "enemy" ? "cell-enemy" : "cell-player"}
                " ${clickFn} ${rightClickFn}>
                    ${troop ? `
                        <div class="troop-name">${troop.name}</div>
                        <div class="troop-stats">
                            <span class="atk">⚔${troop.attack}</span>
                            <span class="hp ${troop.health <= 2 ? "hp-crit" : ""}">❤${troop.health}</span>
                        </div>
                        <div class="troop-tags">
                            ${troop.summonFatigue ? '<span class="tag tag-fatigue">😴</span>' : ""}
                            ${troop.isStunned ? '<span class="tag tag-stun">💫</span>' : ""}
                            ${troop.poisonTurnsLeft > 0 ? `<span class="tag tag-poison">☠${troop.poisonTurnsLeft}</span>` : ""}
                            ${troop.burnTurnsLeft > 0 ? `<span class="tag tag-burn">🔥${troop.burnTurnsLeft}</span>` : ""}
                            ${troop.curseTurnsLeft > 0 ? `<span class="tag tag-curse">💜${troop.curseTurnsLeft}</span>` : ""}
                            ${troop.isMarked ? '<span class="tag tag-mark">🎯</span>' : ""}
                            ${troop.effect?.type === "lastStand" && troop.effect?.used ? '<span class="tag tag-used">💔</span>' : ""}
                        </div>
                    ` : isPlaceable ? `<div class="cell-placeholder placeable-hint">＋</div>` : `<div class="cell-placeholder">—</div>`}
                </div>`
            }).join("")}
        </div>`
    }

    _renderCard(card, index) {
        const canAfford = card.cost <= this.playerEnergy
        const isSelected = this.selectedCardIndex === index
        const isSpell = card.type === "spell"

        return `
        <div class="hand-card
            ${canAfford ? "card-playable" : "card-unaffordable"}
            ${isSelected ? "card-selected" : ""}
            ${isSpell ? "card-spell" : ""}
        "
            onclick="window.game.combatSystem.selectCard(${index})"
            oncontextmenu="event.preventDefault(); window.game.combatSystem.showPreview(${JSON.stringify(card).replace(/"/g, '&quot;')})">
            <div class="card-cost">⚡${card.cost}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${isSpell ? "✨ Hechizo" : card.subtype}</div>
            ${!isSpell ? `
                <div class="card-stats">
                    <span>⚔${card.attack}</span>
                    <span>❤${card.health}</span>
                </div>
            ` : `<div class="card-spell-icon">✨</div>`}
        </div>`
    }
}

// Helper global para obtener referencia a carta de tropa
window._troopCardRef = function(id, side, row, col) {
    const cs = window.game.combatSystem
    const troop = cs.board.getTroop(side, row, col)
    if (!troop) return null
    // Buscar en cardsData
    const allCards = Object.values((window._cardsDataCache || {}))
    const found = allCards.find(c => c.id === troop.id)
    if (found) return found
    // Fallback: construir desde la tropa
    return {
        id: troop.id,
        name: troop.name,
        type: "troop",
        subtype: troop.type,
        cost: "?",
        attack: troop.attack,
        health: troop.health,
        effectDescription: troop.effect ? `Efecto: ${troop.effect.type}` : "Sin habilidad"
    }
}

// Cache de cardsData para el helper
import { cardsData as _cd } from "../Data/cardsdata.js"
window._cardsDataCache = _cd