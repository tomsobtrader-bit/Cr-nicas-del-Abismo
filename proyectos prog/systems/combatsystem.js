import { BoardSystem } from "./boardsystem.js"

export class CombatSystem {

constructor(game){

this.game = game

this.board = new BoardSystem()

this.playerHealth = 30
this.enemyHealth = 30

this.energy = 5
this.attackLimit = 3
this.attacksUsed = 0

this.selectedAttacker = null

}

startCombat(){

this.render()

}

startTurn(){

this.attacksUsed = 0

this.energy = Math.min(this.energy + 3,10)

this.startTroopTurns("player")

this.render()

}

startTroopTurns(side){

const sideBoard = this.board.board[side]

;["melee","ranged"].forEach(row=>{

sideBoard[row].forEach(t=>{

if(t) t.startTurn()

})

})

}

selectAttacker(row,col){

const troop = this.board.getTroop("player",row,col)

if(!troop) return

if(!troop.canAttack()) return

this.selectedAttacker = {row,col,troop}

console.log("Atacante seleccionado:",troop.name)

}

attackTarget(row,col){

if(!this.selectedAttacker) return

if(this.attacksUsed >= this.attackLimit) return

const attacker = this.selectedAttacker.troop

const defender = this.board.getTroop("enemy",row,col)

if(attacker.type === "melee"){

if(col !== this.selectedAttacker.col) return

}

if(defender){

attacker.attackTarget(defender)

}else{

this.enemyHealth -= attacker.attack

}

this.attacksUsed++

this.selectedAttacker = null

this.board.removeDead()

this.render()

}

endTurn(){

const possible = this.countPossibleAttacks()

const unused = possible - this.attacksUsed

const bonus = Math.min(unused,2)

this.energy = Math.min(this.energy + bonus,10)

this.enemyTurn()

}

enemyTurn(){

// IA mínima
console.log("Turno enemigo")

this.startTroopTurns("enemy")

this.render()

}

countPossibleAttacks(){

let count = 0

const board = this.board.board.player

;["melee","ranged"].forEach(row=>{

board[row].forEach(t=>{

if(t && t.canAttack()) count++

})

})

return count

}

render(){

const container = document.getElementById("board")

container.innerHTML = ""

const sides = ["enemy","player"]

sides.forEach(side=>{

const sideDiv = document.createElement("div")
sideDiv.className = "side"

const data = this.board.board[side]

;["melee","ranged"].forEach(row=>{

const rowDiv = document.createElement("div")
rowDiv.className = "row"

data[row].forEach((troop,col)=>{

const cell = document.createElement("div")
cell.className = "cell"

if(troop){

cell.innerText = troop.name+"\n"+troop.attack+"/"+troop.health

if(side==="player"){
cell.onclick = ()=>this.selectAttacker(row,col)
}else{
cell.onclick = ()=>this.attackTarget(row,col)
}

}

rowDiv.appendChild(cell)

})

sideDiv.appendChild(rowDiv)

})

container.appendChild(sideDiv)

})

document.getElementById("stats").innerText =
"Jugador HP:"+this.playerHealth+
" | Enemigo HP:"+this.enemyHealth+
" | Energía:"+this.energy+
" | Ataques:"+this.attacksUsed+"/3"

}

}