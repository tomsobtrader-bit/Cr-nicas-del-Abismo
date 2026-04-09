import { CombatSystem } from "./Systems/combatsystem.js"
import { RewardSystem }  from "./Systems/rewardsystem.js"
import { cardsData, STARTER_TROOPS, SPELLS_POOL } from "./Data/cardsdata.js"

export class Game {

    constructor() {
        this.runManager = { level: 1 }

        // ── Mazo persistente de la run (hasta 10 cartas) ─────────────────────
        // Arranca con 4 tropas base al azar + 1 hechizo al azar
        this.deckList = this._buildStarterDeck()

        // ── HP del jugador persistente entre niveles ──────────────────────────
        this.playerHealth = 30

        this.combatSystem = new CombatSystem(this)
        this.rewardSystem = new RewardSystem(this)

        console.log("Crónicas del Abismo — iniciado")
        console.log("Mazo inicial:", this.deckList.map(c => c.name).join(", "))
    }

    // ── Construir mazo inicial: 4 tropas base al azar + 1 hechizo al azar ────
    _buildStarterDeck() {
        // Tropas base disponibles
        const troopIds  = [...STARTER_TROOPS].sort(() => Math.random() - 0.5)
        const spellIds  = [...SPELLS_POOL].sort(() => Math.random() - 0.5)
        const allCards  = Object.values(cardsData)

        const deck = []

        // 4 tropas base únicas al azar
        for (const id of troopIds) {
            if (deck.length >= 4) break
            const card = allCards.find(c => c.id === id)
            if (card) deck.push(card)
        }

        // 1 hechizo al azar
        const spellCard = allCards.find(c => c.id === spellIds[0])
        if (spellCard) deck.push(spellCard)

        return deck
    }

    // ── Añadir carta al mazo (desde recompensa) ───────────────────────────────
    addCardToDeck(card) {
        if (!card) return
        if (this.deckList.length >= 10) return
        this.deckList.push(card)
        console.log(`Carta añadida al mazo: ${card.name} (${this.deckList.length}/10)`)
    }

    // ── Avanzar al siguiente nivel ────────────────────────────────────────────
    advanceLevel() {
        this.runManager.level++
        const level = this.runManager.level

        // Mostrar pantalla de recompensa antes del siguiente combate
        this.rewardSystem.renderRewardScreen(
            this.rewardSystem.generateRewards(level - 1),
            (chosenCard) => {
                this.addCardToDeck(chosenCard)
                this._startNextCombat(level)
            }
        )

        if (typeof window._updateRunBar === "function") {
            window._updateRunBar(level)
        }
    }

    _startNextCombat(level) {
        // HP del enemigo escala con el nivel
        let newEnemyHp
        if (level === 1)      newEnemyHp = 5
        else if (level === 2) newEnemyHp = 10
        else                  newEnemyHp = level * 5

        this.combatSystem = new CombatSystem(this)
        this.combatSystem.enemyHealth  = newEnemyHp
        this.combatSystem.playerHealth = this.playerHealth

        this.combatSystem.startCombat()

        if (typeof window._updateRunBar === "function") {
            window._updateRunBar(level)
        }
    }

    // ── Guardar HP del jugador al terminar un combate ─────────────────────────
    savePlayerHealth(hp) {
        this.playerHealth = Math.max(0, hp)
    }
}