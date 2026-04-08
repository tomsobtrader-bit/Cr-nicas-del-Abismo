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
        this.pendingHealTarget = null

        this.turn = 1
        this.phase = "play"
        this.gameOver = false
        this.logs = []

        this.playerHand = []
        this.enemyHand = []
        this.playerDeck = []
        this.enemyDeck = []
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
        const all = Object.values(cardsData).filter(c => c.type === "troop")
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

        this.playerEnergy = Math.min(this.playerEnergy + 3, this.maxEnergy)
        this.enemyEnergy = Math.min(this.enemyEnergy + 3, this.maxEnergy)

        this._drawCard("player")
        this._drawCard("enemy")

        this._startTroopTurns("player")
        this._startTroopTurns("enemy")

        const dead = this.board.removeDead()
        this._applyDeathEffects(dead)

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

    playCard(index) {
        if (this.gameOver) return
        if (this.pendingHealTarget) return
        const card = this.playerHand[index]
        if (!card) return
        if (card.cost > this.playerEnergy) {
            this.log("❌ Energía insuficiente")
            this.render()
            return
        }
        const row = card.subtype === "ranged" ? "ranged" : "melee"
        if (!this.board.hasFreeSlot("player", row)) {
            this.log("❌ No hay espacio en el tablero")
            this.render()
            return
        }
        const troop = new Troop(card, "player")
        const placed = this.board.placeTroop("player", troop)
        if (!placed) return
        this.playerEnergy -= card.cost
        this.playerHand.splice(index, 1)
        this.log(`✅ Invocaste ${troop.name}`)

        if (card.effect && card.effect.type === "healAllyOnPlay") {
            const allies = this.board.getTroops("player").filter(({ troop: t }) => t !== troop)
            if (allies.length > 0) {
                this.pendingHealTarget = { amount: card.effect.healAmount }
                this.log(`💚 Elegí una tropa aliada para curar (+${card.effect.healAmount} HP)`)
            } else {
                this.log(`💚 No hay aliados para curar`)
            }
            this.render()
            return
        }

        if (card.effect && card.effect.type === "summonSpecterEachTurn") {
            troop._summonSpecter(this.board, this)
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
        if (this.pendingHealTarget) return
        const troop = this.board.getTroop("player", row, col)
        if (!troop || !troop.canAttack()) return
        this.selectedAttacker = { row, col, troop }
        this.log(`🎯 Seleccionaste: ${troop.name}`)
        this.render()
    }

    attackTarget(row, col) {
        if (!this.selectedAttacker) return
        if (this.attacksUsed >= this.attackLimit) return
        if (this.pendingHealTarget) return

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
        const possible = this._countPossibleAttacks()
        const unused = Math.max(0, possible - this.attacksUsed)
        const bonus = Math.min(unused, 2)
        if (bonus > 0) {
            this.playerEnergy = Math.min(this.playerEnergy + bonus, this.maxEnergy)
            this.log(`⚡ Bonus energía: +${bonus}`)
        }
        this.phase = "enemy"
        this.selectedAttacker = null
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

    log(msg) {
        this.logs.unshift(msg)
        if (this.logs.length > 20) this.logs.pop()
    }

    render() {
        const app = document.getElementById("app")
        if (!app) return
        const selId = this.selectedAttacker
            ? `${this.selectedAttacker.row}-${this.selectedAttacker.col}`
            : null
        const healMode = !!this.pendingHealTarget

        app.innerHTML = `
        <div class="game-wrapper">
            <div class="leader-bar enemy-bar">
                <span class="leader-label">👹 ENEMIGO</span>
                <span class="leader-hp ${this.enemyHealth <= 10 ? 'hp-low' : ''}">❤️ ${this.enemyHealth}</span>
                <span class="energy-display">⚡ ${this.enemyEnergy}/${this.maxEnergy}</span>
            </div>
            <div class="battlefield">
                ${this._renderRow("enemy", "ranged", selId, healMode)}
                ${this._renderRow("enemy", "melee", selId, healMode)}
            </div>
            <div class="divider">
                <button class="btn-leader ${this.selectedAttacker ? 'btn-active' : ''}"
                    onclick="window.game.combatSystem.attackEnemyLeaderDirect()">
                    ⚡ Atacar Líder Enemigo
                </button>
            </div>
            <div class="battlefield">
                ${this._renderRow("player", "melee", selId, healMode)}
                ${this._renderRow("player", "ranged", selId, healMode)}
            </div>
            <div class="leader-bar player-bar">
                <span class="leader-label">🧙 JUGADOR</span>
                <span class="leader-hp ${this.playerHealth <= 10 ? 'hp-low' : ''}">❤️ ${this.playerHealth}</span>
                <span class="energy-display">⚡ ${this.playerEnergy}/${this.maxEnergy}</span>
                <span class="attack-display">⚔️ ${this.attacksUsed}/${this.attackLimit} ataques</span>
                <span class="turn-display">Turno ${this.turn}</span>
            </div>
            <div class="hand-section">
                <div class="hand-label">MANO (${this.playerHand.length}/7)</div>
                <div class="hand">
                    ${this.playerHand.map((card, i) => this._renderCard(card, i)).join("")}
                </div>
            </div>
            <div class="controls">
                ${this.phase !== "enemy" ? `
                    <button class="btn-end" onclick="window.game.combatSystem.endTurn()">
                        Fin de Turno →
                    </button>
                ` : `<div class="enemy-turn-label">⏳ Turno del enemigo...</div>`}
            </div>
            <div class="log-section">
                ${this.logs.slice(0, 8).map(l => `<div class="log-line">${l}</div>`).join("")}
            </div>
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
            ${healMode ? `
                <div class="heal-banner">💚 Elegí una tropa aliada para curar (+${this.pendingHealTarget.amount} HP)</div>
            ` : ""}
        </div>`
    }

    _renderRow(side, row, selId, healMode) {
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
                let clickFn = ""
                if (side === "player" && troop && !healMode) {
                    clickFn = `onclick="window.game.combatSystem.selectAttacker('${row}','${col}')"`
                } else if (side === "player" && troop && healMode) {
                    clickFn = `onclick="window.game.combatSystem.healAllyTarget('${row}','${col}')"`
                } else if (side === "enemy" && this.selectedAttacker) {
                    clickFn = `onclick="window.game.combatSystem.attackTarget('${row}','${col}')"`
                }
                return `
                <div class="cell
                    ${troop ? "cell-filled" : "cell-empty"}
                    ${isSelected ? "cell-selected" : ""}
                    ${isAttackable ? "cell-attackable" : ""}
                    ${isHealable ? "cell-healable" : ""}
                    ${side === "enemy" ? "cell-enemy" : "cell-player"}
                " ${clickFn}>
                    ${troop ? `
                        <div class="troop-name">${troop.name}</div>
                        <div class="troop-stats">
                            <span class="atk">⚔${troop.attack}</span>
                            <span class="hp ${troop.health <= 2 ? "hp-crit" : ""}">❤${troop.health}</span>
                        </div>
                        ${troop.summonFatigue ? '<div class="fatigue-tag">😴</div>' : ""}
                        ${troop.poisonTurnsLeft > 0 ? `<div class="poison-tag">☠${troop.poisonTurnsLeft}</div>` : ""}
                    ` : `<div class="cell-placeholder">—</div>`}
                </div>`
            }).join("")}
        </div>`
    }

    _renderCard(card, index) {
        const canAfford = card.cost <= this.playerEnergy
        return `
        <div class="hand-card ${canAfford ? "card-playable" : "card-unaffordable"}"
            onclick="window.game.combatSystem.playCard(${index})">
            <div class="card-cost">⚡${card.cost}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${card.subtype}</div>
            <div class="card-stats">
                <span>⚔${card.attack}</span>
                <span>❤${card.health}</span>
            </div>
        </div>`
    }

}