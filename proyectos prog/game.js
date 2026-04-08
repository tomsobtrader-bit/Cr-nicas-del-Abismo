import { CombatSystem } from "./systems/combatsystem.js"

export class Game {

    constructor() {
        this.runManager = { level: 1 }
        this.combatSystem = new CombatSystem(this)
        console.log("Crónicas del Abismo — iniciado")
    }

}