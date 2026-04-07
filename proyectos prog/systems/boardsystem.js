export class BoardSystem {

constructor(){

this.board = {

player: {
melee: [null,null,null,null],
ranged: [null,null,null,null]
},

enemy: {
melee: [null,null,null,null],
ranged: [null,null,null,null]
}

}

}

placeTroop(side, troop){

const row = troop.type === "ranged" ? "ranged" : "melee"

for(let i=0;i<4;i++){

if(this.board[side][row][i] === null){

this.board[side][row][i] = troop
return {row,col:i}

}

}

return null

}

removeDead(){

["player","enemy"].forEach(side=>{

["melee","ranged"].forEach(row=>{

for(let i=0;i<4;i++){

const troop = this.board[side][row][i]

if(troop && troop.isDead()){

this.board[side][row][i] = null

}

}

})

})

}

getTroop(side,row,col){

return this.board[side][row][col]

}

}