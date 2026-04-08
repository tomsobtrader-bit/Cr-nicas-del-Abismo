export const cardsData = {

    // ─────────────────────────────────────────
    // CARTAS EXISTENTES
    // ─────────────────────────────────────────

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
    },

    // ─────────────────────────────────────────
    // NUEVAS CARTAS
    // ─────────────────────────────────────────

    carroneroDelCampo: {
        id: "carronero_del_campo",
        name: "Carroñero del Campo",
        type: "troop",
        subtype: "melee",
        cost: 2,
        attack: 2,
        health: 3,
        image: "assets/cards/carronero_del_campo.png",
        effect: {
            // Al morir cualquier tropa (aliada o rival), gana +1 de vida
            type: "scavengerOnDeath",
            healthGain: 1
        }
    },

    centinelaDeHierro: {
        id: "centinela_de_hierro",
        name: "Centinela de Hierro",
        type: "troop",
        subtype: "melee",
        cost: 3,
        attack: 2,
        health: 6,
        image: "assets/cards/centinela_de_hierro.png",
        effect: {
            // Inmune a efectos negativos (veneno, congelamiento, etc.)
            type: "immuneToDebuffs"
        }
    },

    espadachinMaldito: {
        id: "espadachin_maldito",
        name: "Espadachín Maldito",
        type: "troop",
        subtype: "melee",
        cost: 4,
        attack: 4,
        health: 10,
        image: "assets/cards/espadachin_maldito.png",
        effect: {
            // Si mata una tropa con su ataque, puede volver a atacar ese mismo turno
            type: "reattackOnKill"
        }
    },

    guardianDelAbismo: {
        id: "guardian_del_abismo",
        name: "Guardián del Abismo",
        type: "troop",
        subtype: "melee",
        cost: 3,
        attack: 1,
        health: 6,
        image: "assets/cards/guardian_del_abismo.png",
        effect: {
            // Al atacar, golpea su columna y una adyacente elegida por el jugador.
            // Si no hay tropa enemiga en columnas adyacentes, la habilidad no tiene efecto.
            type: "doubleColumnAttack"
        }
    },

    invocadorDeSombras: {
        id: "invocador_de_sombras",
        name: "Invocador de Sombras",
        type: "troop",
        subtype: "ranged",
        cost: 3,
        attack: 2,
        health: 3,
        image: "assets/cards/invocador_de_sombras.png",
        effect: {
            // Al inicio de cada turno, invoca un Espectro (1/1 melee)
            // priorizando su columna. Si no hay espacio, cualquier slot melee libre.
            type: "summonSpecterEachTurn",
            specterStats: {
                attack: 1,
                health: 1,
                subtype: "melee"
            }
        }
    },

    portadorDePlagas: {
        id: "portador_de_plagas",
        name: "Portador de Plagas",
        type: "troop",
        subtype: "melee",
        cost: 3,
        attack: 2,
        health: 5,
        image: "assets/cards/portador_de_plagas.png",
        effect: {
            // Al atacar una tropa, le aplica veneno.
            // El veneno hace 1 de daño al inicio de los 2 turnos siguientes.
            // Si la tropa es envenenada de nuevo, los turnos se resetean a 2.
            // No se acumula el daño por turno, solo la duración.
            type: "poisonOnAttack",
            poisonDamage: 1,
            poisonDuration: 2
        }
    },

    sacerdoteOscuro: {
        id: "sacerdote_oscuro",
        name: "Sacerdote Oscuro",
        type: "troop",
        subtype: "ranged",
        cost: 2,
        attack: 1,
        health: 4,
        image: "assets/cards/sacerdote_oscuro.png",
        effect: {
            // Al entrar al campo, el jugador elige una tropa aliada
            // y le otorga +3 de vida (puede superar su vida base).
            type: "healAllyOnPlay",
            healAmount: 3
        }
    },

    titan: {
        id: "titan",
        name: "Titán",
        type: "troop",
        subtype: "melee",
        cost: 7,
        attack: 8,
        health: 20,
        image: "assets/cards/titan.png",
        effect: {
            // Al atacar una tropa, el exceso de daño se transfiere al líder enemigo.
            // Ejemplo: tropa con 5 HP recibe 8 de daño → 3 de daño van al líder.
            type: "excessDamageToLeader"
        }
    }

}