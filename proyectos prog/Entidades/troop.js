export class Troop {

    constructor(card, owner = "player") {
        this.id = card.id
        this.name = card.name
        this.attack = card.attack
        this.health = card.health
        this.maxHealth = card.health
        this.type = card.subtype || "melee"
        this.effect = card.effect || null
        this.owner = owner
        this.col = null

        this.hasAttacked = false
        this.summonFatigue = true

        this.poisonTurnsLeft = 0
        this.poisonDamage = 0

        this.shots = 0
        this.canReattack = false
    }

    startTurn(board, combatSystem) {
        this.hasAttacked = false
        this.canReattack = false

        if (this.summonFatigue) {
            this.summonFatigue = false
        }

        if (this.poisonTurnsLeft > 0) {
            this.health -= this.poisonDamage
            this.poisonTurnsLeft--
            combatSystem.log(`☠️ ${this.name} sufre ${this.poisonDamage} de veneno. HP: ${this.health}`)
        }

        if (this.effect && this.effect.type === "summonSpecterEachTurn" && !this.summonFatigue) {
            this._summonSpecter(board, combatSystem)
        }
    }

    canAttack() {
        if (this.summonFatigue) return false
        if (this.health <= 0) return false
        if (this.hasAttacked && this.canReattack) return true
        return !this.hasAttacked
    }

    attackTarget(target, combatSystem, enemyLeader = null) {
        let damage = this.attack

        if (this.effect && this.effect.type === "criticalCycle") {
            this.shots++
            if (this.shots >= this.effect.shotsNeeded) {
                damage = this.attack * this.effect.multiplier
                this.shots = 0
                combatSystem.log(`💥 ${this.name} hace GOLPE CRÍTICO: ${damage} daño`)
            }
        }

        const targetPrevHealth = target.health

        if (this.effect && this.effect.type === "poisonOnAttack") {
            if (!target.isImmuneToDebuffs()) {
                target.applyPoison(this.effect.poisonDamage, this.effect.poisonDuration)
                combatSystem.log(`☠️ ${target.name} envenenado por ${this.effect.poisonDuration} turnos`)
            }
        }

        target.takeDamage(damage, combatSystem)

        if (this.effect && this.effect.type === "excessDamageToLeader" && enemyLeader !== null) {
            const excess = damage - targetPrevHealth
            if (excess > 0 && target.isDead()) {
                enemyLeader.health -= excess
                combatSystem.log(`⚡ ${this.name} transfiere ${excess} de daño excedente al líder`)
            }
        }

        if (this.effect && this.effect.type === "reattackOnKill") {
            if (target.isDead()) {
                this.canReattack = true
                combatSystem.log(`⚔️ ${this.name} puede atacar de nuevo`)
            }
        }

        this.hasAttacked = true
    }

    takeDamage(dmg, combatSystem) {
        this.health -= dmg
        if (this.health > 0 && this.effect && this.effect.type === "rageOnDamage") {
            this.attack += this.effect.attackGain
            if (combatSystem) combatSystem.log(`😡 ${this.name} entra en FURIA. ATK: ${this.attack}`)
        }
    }

    heal(amount) {
        this.health += amount
    }

    applyPoison(damage, duration) {
        if (this.isImmuneToDebuffs()) return
        this.poisonTurnsLeft = duration
        this.poisonDamage = damage
    }

    isImmuneToDebuffs() {
        return this.effect && this.effect.type === "immuneToDebuffs"
    }

    isDead() {
        return this.health <= 0
    }

    _summonSpecter(board, combatSystem) {
        const stats = this.effect.specterStats
        const specterCard = {
            id: "espectro",
            name: "Espectro",
            attack: stats.attack,
            health: stats.health,
            subtype: stats.subtype,
            effect: null
        }
        const specter = new Troop(specterCard, this.owner)
        specter.summonFatigue = true
        const placed = board.placeTroopAtCol(this.owner, specter, this.col)
        if (placed) {
            combatSystem.log(`👻 ${this.name} invoca un Espectro en columna ${specter.col}`)
        }
    }

}