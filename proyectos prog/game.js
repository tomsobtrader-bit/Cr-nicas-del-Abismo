import { CombatSystem }      from "./Systems/combatsystem.js"
import { RewardSystem }       from "./Systems/rewardsystem.js"
import { WorldMapRenderer }   from "./worldmap-renderer.js"
import { cardsData, STARTER_TROOPS, SPELLS_POOL } from "./Data/cardsdata.js"
import { initBackgroundCanvas } from "./effects.js"
import { audio }               from "./Systems/audiosystem.js"

export class Game {

    constructor() {
        this.runManager   = { level: 1 }
        this.deckList     = this._buildStarterDeck()
        this.playerHealth = 30

        this.combatSystem = new CombatSystem(this)
        this.rewardSystem = new RewardSystem(this)

        // Mapa del mundo
        this.worldMap = null

        initBackgroundCanvas()
        audio.playLobbyMusic()

        console.log("Crónicas del Abismo — iniciado")
    }

    // ── Iniciar el mapa del mundo ─────────────────────────────────────────────
    initWorldMap(containerId) {
        this.worldMap = new WorldMapRenderer(containerId, this)
        this.worldMap.mount()

        // Cuando el jugador hace click en un nodo
        this.worldMap.onNodeClick = (nodeId, zoneId, node) => {
            this._enterNode(nodeId, zoneId, node)
        }

        this.worldMap.show()
    }

    // ── Entrar a un nodo del mapa ─────────────────────────────────────────────
    _enterNode(nodeId, zoneId, node) {
        if (!node) return

        // Ocultar el mapa y mostrar el área de juego
        const mapOverlay = document.getElementById("world-map-overlay")
        const appEl      = document.getElementById("app")

        if (mapOverlay) mapOverlay.style.display = "none"
        if (appEl)      appEl.style.display      = "block"

        // Guardar el nodo activo para después de la victoria
        this._activeNodeId  = nodeId
        this._activeZoneId  = zoneId
        this._activeNode    = node

        // Configurar el combate según el nodo
        const enemyHp = node.enemy?.health ?? 20
        this.runManager.level = this._nodeLevelIndex(nodeId)

        this.combatSystem = new CombatSystem(this)
        this.combatSystem.enemyHealth  = enemyHp
        this.combatSystem.playerHealth = this.playerHealth

        // Actualizar el badge de nivel
        if (typeof window._updateRunBar === "function") window._updateRunBar()

        this.combatSystem.startCombat()
    }

    // ── Cuando el jugador gana un combate ─────────────────────────────────────
    advanceLevel() {
        const node    = this._activeNode
        const nodeId  = this._activeNodeId

        if (!node) { location.reload(); return }

        // Guardar HP del jugador
        this.savePlayerHealth(this.combatSystem.playerHealth)

        // Marcar nodo como completado en el mapa
        if (this.worldMap) {
            this.worldMap.completeNode(nodeId)
        }

        // Verificar si es el jefe final de la última zona (run completa)
        if (node.rewards?.isFinalBoss) {
            // La run terminó — el combatsystem ya muestra la pantalla de victoria final
            return
        }

        // Mostrar pantalla de recompensas
        const rewards = this.rewardSystem.generateRewards(this.runManager.level)
        this.rewardSystem.renderRewardScreen(rewards, (chosenCard) => {
            this.addCardToDeck(chosenCard)
            this._backToMap()
        })
    }

    // ── Volver al mapa ────────────────────────────────────────────────────────
    _backToMap() {
        const appEl      = document.getElementById("app")
        const mapOverlay = document.getElementById("world-map-overlay")

        if (appEl)      appEl.style.display      = "none"
        if (mapOverlay) mapOverlay.style.display  = "flex"

        // Re-montar el mapa con el progreso actualizado
        if (this.worldMap) {
            this.worldMap._renderTabs()
            this.worldMap._renderZone(this.worldMap.selectedZone)
        }

        audio.playLobbyMusic()
    }

    // ── Convertir nodeId a nivel numérico (para enemyAI) ─────────────────────
    _nodeLevelIndex(nodeId) {
        // z1n1 → 1, z1n10 → 10, z2n1 → 11, z2n10 → 20, z3n1 → 21 ... z4n10 → 40
        const zMatch = nodeId.match(/z(\d+)n(\d+)/)
        if (!zMatch) return 1
        const zone = parseInt(zMatch[1])
        const node = parseInt(zMatch[2])
        return (zone - 1) * 10 + node
    }

    // ── Mazo inicial ──────────────────────────────────────────────────────────
    _buildStarterDeck() {
        const troopIds = [...STARTER_TROOPS].sort(() => Math.random() - 0.5)
        const spellIds = [...SPELLS_POOL].sort(() => Math.random() - 0.5)
        const all      = Object.values(cardsData)
        const deck     = []
        for (const id of troopIds) {
            if (deck.length >= 4) break
            const c = all.find(c => c.id === id)
            if (c) deck.push(c)
        }
        const spell = all.find(c => c.id === spellIds[0])
        if (spell) deck.push(spell)
        return deck
    }

    addCardToDeck(card) {
        if (!card || this.deckList.length >= 10) return
        this.deckList.push(card)
        console.log(`Carta añadida: ${card.name} (${this.deckList.length}/10)`)
    }

    savePlayerHealth(hp) {
        this.playerHealth = Math.max(1, hp)
    }
}