import { CombatSystem } from "./Systems/combatsystem.js"

export class Game {

    constructor() {
        this.runManager = { level: 1 }
        // MEJORA 1: Set compartido entre niveles para no repetir cartas
        this.usedCardIds = new Set()
        this.combatSystem = new CombatSystem(this)
        console.log("Crónicas del Abismo — iniciado")
    }

    // Llamado desde el botón "Siguiente Nivel" en la pantalla de victoria
    advanceLevel() {
        this.runManager.level++
        const level = this.runManager.level

        // Calcular HP del siguiente enemigo
        let newEnemyHp
        if (level === 1) {
            newEnemyHp = 5
        } else {
            newEnemyHp = level * 5
        }

        // Resetear el sistema de combate para el nuevo nivel
        // MEJORA 1: pasamos this al constructor para que tome usedCardIds del game
        this.combatSystem = new CombatSystem(this)
        this.combatSystem.enemyHealth = newEnemyHp
        this.combatSystem.playerHealth = window._savedPlayerHealth || 30

        this.combatSystem.startCombat()

        // Actualizar barra de run
        if (typeof window._updateRunBar === "function") {
            window._updateRunBar(level)
        }
    }

}