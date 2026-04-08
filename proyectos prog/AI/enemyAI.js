import { Troop } from "../Entidades/troop.js"
import { cardsData } from "../Data/cardsdata.js"

export class EnemyAI {

    static getEnemyDeck(level) {
        const basic = [
            cardsData.carroneroDelCampo,
            cardsData.carroneroDelCampo,
            cardsData.centinelaDeHierro,
            cardsData.berserkerMaldito,
            cardsData.berserkerMaldito,
            cardsData.exploradorAgil,
            cardsData.escuderoLeal,
        ]
        const mid = [
            cardsData.guardianDelAbismo,
            cardsData.portadorDePlagas,
            cardsData.espadachinMaldito,
            cardsData.invocadorDeSombras,
            cardsData.sacerdoteOscuro,
            cardsData.arqueraDelCrepusculo,
            cardsData.lanzaTormentas,
            cardsData.bestiaFrenetica,
        ]
        const hard = [
            cardsData.titan,
            cardsData.espadachinMaldito,
            cardsData.portadorDePlagas,
            cardsData.invocadorDeSombras,
            cardsData.centinelaDeHierro,
            cardsData.gladiadorArcano,
            cardsData.hechiceraIgnea,
            cardsData.colosoBelico,
        ]
        if (level <= 3) return [...basic]
        if (level <= 6) return [...basic, ...mid]
        return [...mid, ...hard]
    }

    static playTurn(combatSystem) {
        const cs = combatSystem
        const board = cs.board
        EnemyAI._playCards(cs, board)
        EnemyAI._attackWithTroops(cs, board)
    }

    static _playCards(cs, board) {
        let cardsPlayed = 0
        while (cardsPlayed < 2 && cs.enemyHand.length > 0 && cs.enemyEnergy > 0) {
            const affordable = cs.enemyHand
                .filter(c => c.type === "troop") // IA solo juega tropas por ahora
                .map((card, i) => ({ card, i: cs.enemyHand.indexOf(card) }))
                .filter(({ card }) => card.cost <= cs.enemyEnergy)
                .sort((a, b) => b.card.cost - a.card.cost)

            if (affordable.length === 0) break

            const { card, i } = affordable[0]
            const row = card.subtype === "ranged" ? "ranged" : "melee"
            if (!board.hasFreeSlot("enemy", row)) break

            const troop = new Troop(card, "enemy")
            const placed = board.placeTroop("enemy", troop)
            if (placed) {
                cs.enemyEnergy -= card.cost
                cs.enemyHand.splice(i, 1)
                cs.log(`🤖 Enemigo invoca ${troop.name}`)

                // Efectos al entrar
                if (card.effect && card.effect.type === "healAllyOnPlay") {
                    const troops = board.getTroops("enemy")
                    const others = troops.filter(({ troop: t }) => t !== troop)
                    if (others.length > 0) {
                        const target = others.sort((a, b) => a.troop.health - b.troop.health)[0]
                        target.troop.heal(card.effect.healAmount)
                        cs.log(`💚 Sacerdote Oscuro cura ${card.effect.healAmount} HP a ${target.troop.name}`)
                    }
                }
                if (card.effect && card.effect.type === "summonSpecterEachTurn") {
                    troop._summonSpecter(board, cs)
                }
                if (card.effect && card.effect.type === "shieldAllyOnPlay") {
                    const rangedAlly = board.getTroop("enemy", "ranged", troop.col)
                    if (rangedAlly) {
                        rangedAlly.health += card.effect.healthBonus
                        cs.log(`🛡️ ${troop.name} otorga +${card.effect.healthBonus} HP a ${rangedAlly.name}`)
                    }
                }
                if (card.effect && card.effect.type === "chargeAttack") {
                    const target = board.getTroop("player", "melee", troop.col)
                    if (target) {
                        troop.attackTarget(target, cs, { health: cs.playerHealth })
                        cs.log(`🐾 ${troop.name} ataca inmediatamente a ${target.name}`)
                        troop.hasAttacked = false
                    } else {
                        cs.playerHealth -= troop.attack
                        cs.log(`🐾 ${troop.name} ataca al líder jugador: -${troop.attack} HP`)
                    }
                }

                cardsPlayed++
            } else {
                break
            }
        }
    }

    static _attackWithTroops(cs, board) {
        let attacksLeft = cs.attackLimit
        ;["melee", "ranged"].forEach(row => {
            board.board.enemy[row].forEach((troop, col) => {
                if (!troop || !troop.canAttack() || attacksLeft <= 0) return

                let target = null
                let targetIsLeader = false

                if (row === "melee") {
                    const frontTarget = board.getTroop("player", "melee", col)
                    if (frontTarget) {
                        target = frontTarget
                    } else {
                        targetIsLeader = true
                    }
                    if (troop.effect && troop.effect.type === "doubleColumnAttack" && !targetIsLeader) {
                        const adjCols = board.getAdjacentCols(col)
                        const adjWithEnemy = adjCols.filter(ac => board.getTroop("player", "melee", ac))
                        if (adjWithEnemy.length > 0) {
                            const adjTarget = board.getTroop("player", "melee", adjWithEnemy[0])
                            if (adjTarget) {
                                adjTarget.takeDamage(troop.attack, cs)
                                cs.log(`🌀 ${troop.name} golpea también a ${adjTarget.name}`)
                            }
                        }
                    }
                } else {
                    const playerTroops = board.getTroops("player")
                    if (playerTroops.length > 0) {
                        const weakest = playerTroops.sort((a, b) => a.troop.health - b.troop.health)[0]
                        target = weakest.troop
                    } else {
                        targetIsLeader = true
                    }
                }

                if (targetIsLeader) {
                    cs.playerHealth -= troop.attack
                    cs.log(`💀 ${troop.name} ataca al líder: -${troop.attack} HP`)
                    troop.hasAttacked = true
                } else if (target) {
                    const leaderRef = { health: cs.playerHealth }
                    troop.attackTarget(target, cs, leaderRef)
                    if (troop.effect && troop.effect.type === "excessDamageToLeader") {
                        cs.playerHealth = leaderRef.health
                    }
                    cs.log(`⚔️ ${troop.name} ataca a ${target.name}`)
                }

                attacksLeft--
                const dead = board.removeDead()
                cs._applyDeathEffects(dead)
            })
        })
    }
}