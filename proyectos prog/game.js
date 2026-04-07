import { RunManager } from "./runmanager.js"
import { CombatSystem } from "./systems/combatSystem.js"
import { DeckSystem } from "./systems/decksystem.js"
import { BoardSystem } from "./systems/boardsystem.js"
import { EnemyAI } from "./AI/enemyAI.js"

export class Game {

constructor(){

console.log("Game iniciado")

this.runManager = new RunManager()

this.deckSystem = new DeckSystem()

this.boardSystem = new BoardSystem()

this.combatSystem = new CombatSystem(this)

this.enemyAI = new EnemyAI(this)

}

startGame(){

console.log("Iniciando juego")

this.runManager.startRun()

this.startCombat()

}

startCombat(){

console.log("Comienza combate")

this.combatSystem.startCombat()

}

playerWonCombat(){

console.log("Jugador ganó el combate")

this.runManager.level++

if(this.runManager.level > 10){

this.winRun()

}else{

this.startCombat()

}

}

playerLostCombat(){

console.log("Jugador perdió la run")

this.runManager.endRun()

}

winRun(){

console.log("RUN COMPLETADA")

}

}