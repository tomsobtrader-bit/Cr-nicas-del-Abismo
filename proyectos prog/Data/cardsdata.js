export const cardsData = {

arqueroEspectral: {

id: "arquero_espectral",
name: "Arquero Espectral",

type: "troop",
subtype: "ranged",

cost: 2,

attack: 3,
health: 2,

image: "assets/cards/arquero_espectral.png",

effect: {
type: "criticalCycle",
shotsNeeded: 3,
multiplier: 2
}

},

berserkerMaldito: {

id: "berserker_maldito",
name: "Berserker Maldito",

type: "troop",
subtype: "melee",

cost: 2,

attack: 3,
health: 3,

image: "assets/cards/berserker_maldito.png",

effect: {
type: "rageOnDamage",
attackGain: 2
}

}

}