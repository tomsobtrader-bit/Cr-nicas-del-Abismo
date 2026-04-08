// ─────────────────────────────────────────────────────────────────────────────
// RewardSystem — ofrece 3 cartas para elegir al ganar un combate
//
// Lógica de rareza por nivel:
//   Niveles 1-3:  base + algo de corrupta
//   Niveles 4-6:  corrupta + algo de elite
//   Niveles 7-8:  elite + algo de mistica
//   Nivel 9-10:   elite + mistica
// ─────────────────────────────────────────────────────────────────────────────

import { cardsData, TROOPS_BY_RARITY, SPELLS_POOL, RARITY_CONFIG } from "../Data/cardsdata.js"

export class RewardSystem {

    constructor(game) {
        this.game = game
    }

    // ── Generar 3 opciones de recompensa según nivel ─────────────────────────
    generateRewards(level) {
        const pool = this._buildPool(level)
        // Barajar y tomar 3 únicas
        const shuffled = [...pool].sort(() => Math.random() - 0.5)
        const seen = new Set()
        const rewards = []
        for (const id of shuffled) {
            if (seen.has(id)) continue
            seen.add(id)
            const card = Object.values(cardsData).find(c => c.id === id)
            if (card) rewards.push(card)
            if (rewards.length === 3) break
        }
        // Si no hay suficientes, rellenar con base
        while (rewards.length < 3) {
            const fallback = Object.values(cardsData).find(c => c.rarity === "base" && !rewards.find(r => r.id === c.id))
            if (fallback) rewards.push(fallback)
            else break
        }
        return rewards
    }

    _buildPool(level) {
        const pool = []
        if (level <= 3) {
            pool.push(...TROOPS_BY_RARITY.base, ...TROOPS_BY_RARITY.base)
            pool.push(...TROOPS_BY_RARITY.corrupta)
            pool.push(...SPELLS_POOL)
        } else if (level <= 6) {
            pool.push(...TROOPS_BY_RARITY.base)
            pool.push(...TROOPS_BY_RARITY.corrupta, ...TROOPS_BY_RARITY.corrupta)
            pool.push(...TROOPS_BY_RARITY.elite)
            pool.push(...SPELLS_POOL)
        } else if (level <= 8) {
            pool.push(...TROOPS_BY_RARITY.corrupta)
            pool.push(...TROOPS_BY_RARITY.elite, ...TROOPS_BY_RARITY.elite)
            pool.push(...TROOPS_BY_RARITY.mistica)
            pool.push(...SPELLS_POOL)
        } else {
            pool.push(...TROOPS_BY_RARITY.elite)
            pool.push(...TROOPS_BY_RARITY.mistica, ...TROOPS_BY_RARITY.mistica)
            pool.push(...SPELLS_POOL)
        }
        return pool
    }

    // ── Renderizar pantalla de recompensa ────────────────────────────────────
    renderRewardScreen(rewards, onPick) {
        const app = document.getElementById("app")
        if (!app) return

        const deckSize = this.game.deckList?.length || 0
        const deckFull = deckSize >= 10

        app.innerHTML = `
        <div class="reward-overlay">
            <div class="reward-box">
                <div class="reward-title">⚔️ VICTORIA</div>
                <div class="reward-subtitle">
                    Elegí una carta para añadir a tu mazo
                    <span class="reward-deck-count">(${deckSize}/10 cartas)</span>
                </div>

                ${deckFull ? `
                    <div class="reward-full-warning">
                        ⚠️ Tu mazo está lleno (10/10). No podés añadir más cartas.
                    </div>
                ` : ""}

                <div class="reward-cards">
                    ${rewards.map((card, i) => this._renderRewardCard(card, i, deckFull)).join("")}
                </div>

                <button class="reward-skip" onclick="window._rewardSkip()">
                    Continuar sin elegir →
                </button>
            </div>
        </div>`

        window._rewardPick = (index) => {
            const chosen = rewards[index]
            onPick(chosen)
        }
        window._rewardSkip = () => {
            onPick(null)
        }
    }

    _renderRewardCard(card, index, disabled) {
        const isSpell  = card.type === "spell"
        const rarity   = card.rarity ? RARITY_CONFIG[card.rarity] : null
        const rarityStyle = rarity
            ? `border-color: ${rarity.border}; box-shadow: 0 0 18px ${rarity.glow};`
            : ""
        const rarityLabel = rarity
            ? `<div class="reward-card-rarity" style="color:${rarity.color}; border-color:${rarity.border}">
                   ${rarity.label}
               </div>`
            : `<div class="reward-card-rarity spell-tag">✨ HECHIZO</div>`

        const imgHtml = card.image
            ? `<img src="${card.image}" alt="${card.name}" onerror="this.style.display='none'">`
            : `<div class="reward-card-placeholder">${isSpell ? "✨" : "⚔️"}</div>`

        return `
        <div class="reward-card ${disabled ? 'reward-card-disabled' : ''}"
             style="${disabled ? '' : rarityStyle}"
             onclick="${disabled ? '' : `window._rewardPick(${index})`}">
            <div class="reward-card-img">${imgHtml}</div>
            ${rarityLabel}
            <div class="reward-card-body">
                <div class="reward-card-name">${card.name}</div>
                <div class="reward-card-type">${isSpell ? "✨ Hechizo" : card.subtype === "ranged" ? "🏹 Distancia" : "⚔️ Melee"}</div>
                <div class="reward-card-stats">
                    <span class="rc-cost">⚡${card.cost}</span>
                    ${!isSpell ? `<span class="rc-atk">⚔${card.attack}</span><span class="rc-hp">❤${card.health}</span>` : ""}
                </div>
                <div class="reward-card-effect">${card.effectDescription || "Sin habilidad especial"}</div>
            </div>
        </div>`
    }
}