export class Troop {

constructor(card){

this.id = card.id
this.name = card.name

this.attack = card.attack
this.health = card.health

this.type = card.subtype || "melee" // "melee" o "ranged"

this.effect = card.effect || null

// estados
this.shots = 0
this.hasAttacked = false
this.summonFatigue = true

}

startTurn(){

this.hasAttacked = false

if(this.summonFatigue){
this.summonFatigue = false
}

}

canAttack(){

return !this.hasAttacked && !this.summonFatigue && this.health > 0

}

attackTarget(target){

let damage = this.attack

// habilidad arquero espectral
if(this.effect && this.effect.type === "criticalCycle"){

this.shots++

if(this.shots === this.effect.shotsNeeded){

damage = this.attack * this.effect.multiplier
this.shots = 0

console.log(this.name + " hace GOLPE CRITICO")

}

}

target.takeDamage(damage)

this.hasAttacked = true

}

takeDamage(dmg){

this.health -= dmg

// habilidad berserker
if(this.health > 0 && this.effect){

if(this.effect.type === "rageOnDamage"){

this.attack += this.effect.attackGain

console.log(this.name + " entra en FURIA. ATK:", this.attack)

}

}

}

isDead(){

return this.health <= 0

}

}