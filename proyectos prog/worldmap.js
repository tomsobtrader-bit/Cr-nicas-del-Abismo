// ─────────────────────────────────────────────────────────────────────────────
// worldmap.js — Datos de las 4 zonas con 10 nodos cada una
// ─────────────────────────────────────────────────────────────────────────────

export const WORLD_DATA = {

    zone1: {
        id: "zone1",
        name: "Las Ruinas Exteriores",
        subtitle: "Donde todo comenzó a corromperse",
        color: "#c8a050",
        glowColor: "rgba(200,160,80,0.4)",
        unlocked: true,
        nodes: [
            {
                id: "z1n1", name: "Bosque Podrido",
                lore: "Los árboles susurran nombres de los muertos.",
                type: "combat", position: { x: 10, y: 75 },
                enemy: { name: "Guardabosque Corrompido", health: 5, portrait: "🌲",
                    deck: ["explorador_agil","carronero_del_campo"], energy: 3 },
                rewards: { gold: 15, xp: 20 }, repeatRewards: { gold: 7, xp: 8 }
            },
            {
                id: "z1n2", name: "Aldea en Llamas",
                lore: "Las cenizas aún están tibias.",
                type: "combat", position: { x: 24, y: 62 },
                enemy: { name: "Saqueador Maldito", health: 7, portrait: "🔥",
                    deck: ["explorador_agil","berserker_maldito","carronero_del_campo"], energy: 3 },
                rewards: { gold: 18, xp: 22 }, repeatRewards: { gold: 8, xp: 9 }
            },
            {
                id: "z1n3", name: "El Molino Roto",
                lore: "Las aspas giran aunque no haya viento.",
                type: "combat", position: { x: 16, y: 48 },
                enemy: { name: "Espíritu del Molino", health: 9, portrait: "👻",
                    deck: ["explorador_agil","berserker_maldito","escudero_leal"], energy: 3 },
                rewards: { gold: 20, xp: 25 }, repeatRewards: { gold: 9, xp: 10 }
            },
            {
                id: "z1n4", name: "Puente de Piedra",
                lore: "Algo vive bajo el río oscuro.",
                type: "combat", position: { x: 38, y: 55 },
                enemy: { name: "Troll de Piedra", health: 11, portrait: "🪨",
                    deck: ["centinela_de_hierro","escudero_leal","carronero_del_campo"], energy: 4 },
                rewards: { gold: 22, xp: 28 }, repeatRewards: { gold: 10, xp: 11 }
            },
            {
                id: "z1n5", name: "Mercado Abandonado",
                lore: "Los puestos aún tienen mercancía. Nadie la reclama.",
                type: "event", position: { x: 52, y: 65 },
                event: { type: "shop_basic", description: "Un mercader fantasma ofrece sus servicios." },
                rewards: { gold: 10, xp: 15 }, repeatRewards: { gold: 5, xp: 5 }
            },
            {
                id: "z1n6", name: "Cementerio Antiguo",
                lore: "Las lápidas tienen fechas que aún no llegaron.",
                type: "combat", position: { x: 46, y: 45 },
                enemy: { name: "Guardián de Tumbas", health: 13, portrait: "💀",
                    deck: ["centinela_de_hierro","carronero_del_campo","portador_de_plagas","escudero_leal"], energy: 4 },
                rewards: { gold: 25, xp: 30 }, repeatRewards: { gold: 11, xp: 12 }
            },
            {
                id: "z1n7", name: "La Torre del Vigía",
                lore: "Desde aquí se puede ver cómo el abismo avanza.",
                type: "combat", position: { x: 63, y: 52 },
                enemy: { name: "Vigía Eterno", health: 15, portrait: "🗼",
                    deck: ["arquero_espectral","centinela_de_hierro","berserker_maldito","escudero_leal"], energy: 4 },
                rewards: { gold: 28, xp: 33 }, repeatRewards: { gold: 12, xp: 13 }
            },
            {
                id: "z1n8", name: "Catacumbas Superficiales",
                lore: "El primer nivel. Nadie sabe cuántos hay debajo.",
                type: "combat", position: { x: 72, y: 40 },
                enemy: { name: "Excavador de Almas", health: 17, portrait: "⛏️",
                    deck: ["portador_de_plagas","carronero_del_campo","berserker_maldito","centinela_de_hierro"], energy: 5 },
                rewards: { gold: 30, xp: 36 }, repeatRewards: { gold: 13, xp: 14 }
            },
            {
                id: "z1n9", name: "El Altar Roto",
                lore: "Alguien intentó sellarlo. No lo logró.",
                type: "elite", position: { x: 82, y: 50 },
                enemy: { name: "Sacerdote Caído", health: 19, portrait: "🕯️",
                    deck: ["arquero_espectral","portador_de_plagas","guardian_del_abismo","centinela_de_hierro","berserker_maldito"], energy: 5 },
                rewards: { gold: 40, xp: 50, chestType: "cofre_madera" }, repeatRewards: { gold: 18, xp: 20 }
            },
            {
                id: "z1n10", name: "El Carcelero",
                lore: "Guardó la puerta durante siglos. Ahora la abre.",
                type: "boss", position: { x: 90, y: 28 },
                enemy: { name: "El Carcelero", health: 20, portrait: "🔒",
                    deck: ["guardian_del_abismo","centinela_de_hierro","arquero_espectral","portador_de_plagas","berserker_maldito","escudero_leal"], energy: 6,
                    specialAbility: "Cada 2 turnos invoca un Centinela 2/5" },
                rewards: { gold: 100, xp: 150, chestType: "cofre_plata", unlocksZone: "zone2" },
                repeatRewards: { gold: 40, xp: 50 }
            }
        ]
    },

    zone2: {
        id: "zone2",
        name: "El Pantano Maldito",
        subtitle: "El veneno aquí tiene nombre propio",
        color: "#50aa50",
        glowColor: "rgba(80,170,80,0.4)",
        unlocked: false,
        nodes: [
            {
                id: "z2n1", name: "Orilla Putrefacta",
                lore: "El agua no refleja la luz. Absorbe todo.",
                type: "combat", position: { x: 10, y: 75 },
                enemy: { name: "Criatura del Barro", health: 20, portrait: "🟤",
                    deck: ["portador_de_plagas","carronero_del_campo","berserker_maldito"], energy: 4 },
                rewards: { gold: 35, xp: 45 }, repeatRewards: { gold: 15, xp: 18 }
            },
            {
                id: "z2n2", name: "Los Juncos Negros",
                lore: "Se mueven sin viento. Escuchan todo.",
                type: "combat", position: { x: 24, y: 63 },
                enemy: { name: "Acechador del Pantano", health: 22, portrait: "🌿",
                    deck: ["arquera_del_crepusculo","portador_de_plagas","lanza_tormentas"], energy: 4 },
                rewards: { gold: 38, xp: 48 }, repeatRewards: { gold: 16, xp: 19 }
            },
            {
                id: "z2n3", name: "Cabaña del Ermitaño",
                lore: "Lleva aquí desde antes de que el pantano existiera.",
                type: "event", position: { x: 17, y: 50 },
                event: { type: "upgrade_card", description: "El ermitaño ofrece mejorar una de tus cartas." },
                rewards: { gold: 20, xp: 30 }, repeatRewards: { gold: 8, xp: 12 }
            },
            {
                id: "z2n4", name: "El Puente Hundido",
                lore: "Hay algo atascado ahí abajo. Algo vivo.",
                type: "combat", position: { x: 38, y: 58 },
                enemy: { name: "Behemoth del Fango", health: 24, portrait: "🐊",
                    deck: ["guardian_del_abismo","centinela_de_hierro","portador_de_plagas","carronero_del_campo"], energy: 5 },
                rewards: { gold: 40, xp: 52 }, repeatRewards: { gold: 17, xp: 20 }
            },
            {
                id: "z2n5", name: "Aldea de los Infectados",
                lore: "No tienen cura. Tienen rabia.",
                type: "combat", position: { x: 50, y: 70 },
                enemy: { name: "Líder de los Infectados", health: 26, portrait: "🤒",
                    deck: ["portador_de_plagas","lanza_tormentas","berserker_maldito","arquera_del_crepusculo"], energy: 5 },
                rewards: { gold: 42, xp: 55 }, repeatRewards: { gold: 18, xp: 22 }
            },
            {
                id: "z2n6", name: "El Árbol Madre",
                lore: "Sus raíces llegan hasta el núcleo del abismo.",
                type: "combat", position: { x: 46, y: 48 },
                enemy: { name: "Espíritu del Árbol", health: 28, portrait: "🌳",
                    deck: ["invocador_de_sombras","guardian_del_abismo","centinela_de_hierro","portador_de_plagas"], energy: 5 },
                rewards: { gold: 45, xp: 58 }, repeatRewards: { gold: 19, xp: 23 }
            },
            {
                id: "z2n7", name: "Templo Sumergido",
                lore: "Los ritos que se hacen aquí no tienen nombre.",
                type: "combat", position: { x: 62, y: 55 },
                enemy: { name: "Sacerdote del Pantano", health: 30, portrait: "🏛️",
                    deck: ["lanza_tormentas","hechicera_ignea","arquero_espectral","invocador_de_sombras"], energy: 5 },
                rewards: { gold: 48, xp: 62 }, repeatRewards: { gold: 20, xp: 25 }
            },
            {
                id: "z2n8", name: "Las Nieblas Eternas",
                lore: "Aquí adentro los días duran lo mismo que los años.",
                type: "elite", position: { x: 72, y: 43 },
                enemy: { name: "Tejedor de Niebla", health: 32, portrait: "🌫️",
                    deck: ["lanza_tormentas","hechicera_ignea","guardian_del_abismo","arquero_espectral","portador_de_plagas"], energy: 6 },
                rewards: { gold: 60, xp: 80, chestType: "cofre_madera" }, repeatRewards: { gold: 25, xp: 32 }
            },
            {
                id: "z2n9", name: "Santuario Corrompido",
                lore: "Lo que se veneraba aquí ya no recibe plegarias.",
                type: "elite", position: { x: 82, y: 53 },
                enemy: { name: "Guardián del Santuario", health: 34, portrait: "⛩️",
                    deck: ["espadachin_maldito","guardian_del_abismo","lanza_tormentas","centinela_de_hierro","arquero_espectral"], energy: 6 },
                rewards: { gold: 65, xp: 85, chestType: "cofre_plata" }, repeatRewards: { gold: 27, xp: 34 }
            },
            {
                id: "z2n10", name: "La Bruja del Eclipse",
                lore: "Cada dos lunas llenas, el sol desaparece donde ella camina.",
                type: "boss", position: { x: 90, y: 33 },
                enemy: { name: "La Bruja del Eclipse", health: 35, portrait: "🌑",
                    deck: ["hechicera_ignea","lanza_tormentas","invocador_de_sombras","espadachin_maldito","arquero_espectral","guardian_del_abismo"], energy: 7,
                    specialAbility: "Cada 2 turnos hace 3 de daño a todas tus tropas" },
                rewards: { gold: 180, xp: 250, chestType: "cofre_oro", unlocksZone: "zone3" },
                repeatRewards: { gold: 70, xp: 80 }
            }
        ]
    },

    zone3: {
        id: "zone3",
        name: "Las Catacumbas Profundas",
        subtitle: "Aquí abajo, la oscuridad tiene forma",
        color: "#9b59b6",
        glowColor: "rgba(155,89,182,0.4)",
        unlocked: false,
        nodes: [
            {
                id: "z3n1", name: "Primera Galería",
                lore: "Las paredes están talladas con caras. Parpadean.",
                type: "combat", position: { x: 10, y: 75 },
                enemy: { name: "Centinela de Hueso", health: 35, portrait: "🦴",
                    deck: ["centinela_de_hierro","guardian_del_abismo","espadachin_maldito","berserker_maldito"], energy: 5 },
                rewards: { gold: 55, xp: 70 }, repeatRewards: { gold: 22, xp: 28 }
            },
            {
                id: "z3n2", name: "Sala de los Ecos",
                lore: "Tus palabras regresan en la voz de alguien más.",
                type: "combat", position: { x: 24, y: 63 },
                enemy: { name: "El Eco Viviente", health: 37, portrait: "🔊",
                    deck: ["lanza_tormentas","arquero_espectral","hechicera_ignea","invocador_de_sombras"], energy: 5 },
                rewards: { gold: 58, xp: 73 }, repeatRewards: { gold: 23, xp: 29 }
            },
            {
                id: "z3n3", name: "Cripta de los Héroes",
                lore: "Vinieron a salvar el mundo. Ahora lo guardan desde adentro.",
                type: "combat", position: { x: 17, y: 50 },
                enemy: { name: "Héroe Caído", health: 39, portrait: "⚔️",
                    deck: ["espadachin_maldito","bestia_frenetica","guardian_del_abismo","centinela_de_hierro"], energy: 5 },
                rewards: { gold: 60, xp: 76 }, repeatRewards: { gold: 24, xp: 30 }
            },
            {
                id: "z3n4", name: "El Pozo Sin Fondo",
                lore: "Nadie ha llegado abajo. Nadie que haya vuelto, al menos.",
                type: "event", position: { x: 38, y: 60 },
                event: { type: "risky_reward", description: "Sacrificá 10 HP para obtener un cofre de oro." },
                rewards: { gold: 25, xp: 35 }, repeatRewards: { gold: 10, xp: 14 }
            },
            {
                id: "z3n5", name: "Laboratorio del Alquimista",
                lore: "Buscaba la inmortalidad. La encontró de la peor manera.",
                type: "combat", position: { x: 52, y: 68 },
                enemy: { name: "Alquimista Inmortal", health: 41, portrait: "⚗️",
                    deck: ["hechicera_ignea","lanza_tormentas","portador_de_plagas","invocador_de_sombras","arquero_espectral"], energy: 6 },
                rewards: { gold: 63, xp: 80 }, repeatRewards: { gold: 25, xp: 32 }
            },
            {
                id: "z3n6", name: "Sala del Trono Vacío",
                lore: "El trono está ocupado. Pero no hay nadie sentado.",
                type: "combat", position: { x: 47, y: 48 },
                enemy: { name: "Presencia del Trono", health: 43, portrait: "👑",
                    deck: ["coloso_belico","guardian_del_abismo","espadachin_maldito","centinela_de_hierro"], energy: 6 },
                rewards: { gold: 66, xp: 83 }, repeatRewards: { gold: 26, xp: 33 }
            },
            {
                id: "z3n7", name: "Galería de los Espejos",
                lore: "Cada espejo muestra una versión tuya que tomó decisiones distintas.",
                type: "combat", position: { x: 63, y: 55 },
                enemy: { name: "Tu Reflejo", health: 45, portrait: "🪞",
                    deck: ["bestia_frenetica","espadachin_maldito","coloso_belico","lanza_tormentas","arquero_espectral"], energy: 6 },
                rewards: { gold: 68, xp: 86 }, repeatRewards: { gold: 27, xp: 34 }
            },
            {
                id: "z3n8", name: "El Corazón de Piedra",
                lore: "Late una vez cada hora. Cada latido apaga una antorcha.",
                type: "elite", position: { x: 73, y: 43 },
                enemy: { name: "Guardián del Corazón", health: 47, portrait: "💜",
                    deck: ["coloso_belico","titan","guardian_del_abismo","centinela_de_hierro","espadachin_maldito"], energy: 7 },
                rewards: { gold: 85, xp: 110, chestType: "cofre_plata" }, repeatRewards: { gold: 35, xp: 44 }
            },
            {
                id: "z3n9", name: "Antesala del Abismo",
                lore: "Desde aquí ya se escucha. No hay palabras para describirlo.",
                type: "elite", position: { x: 83, y: 53 },
                enemy: { name: "Heraldo del Abismo", health: 49, portrait: "🌀",
                    deck: ["titan","coloso_belico","espadachin_maldito","lanza_tormentas","hechicera_ignea","guardian_del_abismo"], energy: 7 },
                rewards: { gold: 90, xp: 120, chestType: "cofre_oro" }, repeatRewards: { gold: 37, xp: 48 }
            },
            {
                id: "z3n10", name: "El Señor de los Cadáveres",
                lore: "Colecciona almas como otros coleccionan monedas.",
                type: "boss", position: { x: 91, y: 32 },
                enemy: { name: "El Señor de los Cadáveres", health: 50, portrait: "💀",
                    deck: ["titan","coloso_belico","espadachin_maldito","invocador_de_sombras","guardian_del_abismo","lanza_tormentas","hechicera_ignea"], energy: 8,
                    specialAbility: "Cada vez que muere una tropa invoca un Esqueleto 2/2" },
                rewards: { gold: 280, xp: 380, chestType: "cofre_abismo", unlocksZone: "zone4" },
                repeatRewards: { gold: 100, xp: 120 }
            }
        ]
    },

    zone4: {
        id: "zone4",
        name: "El Corazón del Abismo",
        subtitle: "Aquí termina el mundo conocido",
        color: "#e74c3c",
        glowColor: "rgba(231,76,60,0.5)",
        unlocked: false,
        nodes: [
            {
                id: "z4n1", name: "La Grieta",
                lore: "Se abrió hace mil años. Sigue creciendo.",
                type: "combat", position: { x: 10, y: 75 },
                enemy: { name: "Devorador de Grieta", health: 50, portrait: "🕳️",
                    deck: ["titan","coloso_belico","espadachin_maldito","guardian_del_abismo","berserker_maldito"], energy: 6 },
                rewards: { gold: 80, xp: 100 }, repeatRewards: { gold: 32, xp: 40 }
            },
            {
                id: "z4n2", name: "Llanura de Cenizas",
                lore: "Todo lo que fue quemado aquí sigue ardiendo.",
                type: "combat", position: { x: 24, y: 63 },
                enemy: { name: "Señor de las Cenizas", health: 53, portrait: "🔥",
                    deck: ["hechicera_ignea","lanza_tormentas","titan","bestia_frenetica","arquero_espectral"], energy: 6 },
                rewards: { gold: 83, xp: 104 }, repeatRewards: { gold: 33, xp: 41 }
            },
            {
                id: "z4n3", name: "El Obelisco Roto",
                lore: "Grabado en él: instrucciones para despertar algo.",
                type: "combat", position: { x: 17, y: 50 },
                enemy: { name: "Guardián del Obelisco", health: 55, portrait: "🗿",
                    deck: ["coloso_belico","titan","guardian_del_abismo","centinela_de_hierro","lanza_tormentas"], energy: 7 },
                rewards: { gold: 86, xp: 108 }, repeatRewards: { gold: 34, xp: 43 }
            },
            {
                id: "z4n4", name: "Catedral Invertida",
                lore: "Construida al revés, apuntando hacia abajo. Hacia algo.",
                type: "combat", position: { x: 38, y: 60 },
                enemy: { name: "Obispo del Abismo", health: 57, portrait: "⛪",
                    deck: ["sacerdote_oscuro","invocador_de_sombras","titan","espadachin_maldito","lanza_tormentas"], energy: 7 },
                rewards: { gold: 89, xp: 112 }, repeatRewards: { gold: 35, xp: 44 }
            },
            {
                id: "z4n5", name: "Fortaleza de los Condenados",
                lore: "Sus habitantes eligieron estar aquí. Eso es lo más aterrador.",
                type: "event", position: { x: 52, y: 70 },
                event: { type: "gamble", description: "Apostá 50 oro: ganás 150 o lo perdés todo." },
                rewards: { gold: 30, xp: 40 }, repeatRewards: { gold: 12, xp: 16 }
            },
            {
                id: "z4n6", name: "El Lago de Sangre",
                lore: "Nadie sabe de quién es.",
                type: "combat", position: { x: 47, y: 50 },
                enemy: { name: "Entidad del Lago", health: 58, portrait: "🩸",
                    deck: ["titan","coloso_belico","bestia_frenetica","hechicera_ignea","guardian_del_abismo"], energy: 7 },
                rewards: { gold: 92, xp: 116 }, repeatRewards: { gold: 37, xp: 46 }
            },
            {
                id: "z4n7", name: "Torres Gemelas del Fin",
                lore: "Una mira al pasado. La otra al futuro. Ambas muestran lo mismo.",
                type: "combat", position: { x: 63, y: 55 },
                enemy: { name: "Los Centinelas del Fin", health: 60, portrait: "🏰",
                    deck: ["coloso_belico","titan","guardian_del_abismo","espadachin_maldito","centinela_de_hierro","lanza_tormentas"], energy: 7 },
                rewards: { gold: 95, xp: 120 }, repeatRewards: { gold: 38, xp: 48 }
            },
            {
                id: "z4n8", name: "El Trono de Obsidiana",
                lore: "Tallado directamente del núcleo del abismo.",
                type: "elite", position: { x: 73, y: 43 },
                enemy: { name: "Usurpador del Trono", health: 62, portrait: "🖤",
                    deck: ["titan","coloso_belico","espadachin_maldito","bestia_frenetica","lanza_tormentas","hechicera_ignea"], energy: 8 },
                rewards: { gold: 120, xp: 160, chestType: "cofre_oro" }, repeatRewards: { gold: 48, xp: 64 }
            },
            {
                id: "z4n9", name: "Antecámara del Origen",
                lore: "Aquí fue donde todo comenzó. Y donde todo terminará.",
                type: "elite", position: { x: 83, y: 53 },
                enemy: { name: "El Primer Corrompido", health: 64, portrait: "☠️",
                    deck: ["titan","coloso_belico","espadachin_maldito","guardian_del_abismo","bestia_frenetica","lanza_tormentas","hechicera_ignea"], energy: 8,
                    specialAbility: "Al 50% de HP todas sus tropas ganan +2 ATK" },
                rewards: { gold: 130, xp: 175, chestType: "cofre_abismo" }, repeatRewards: { gold: 52, xp: 70 }
            },
            {
                id: "z4n10", name: "El Origen",
                lore: "No tiene nombre real. Los que lo vieron no pudieron describirlo.",
                type: "boss", position: { x: 91, y: 32 },
                enemy: { name: "El Origen", health: 65, portrait: "🌑",
                    deck: ["titan","coloso_belico","espadachin_maldito","bestia_frenetica","guardian_del_abismo","lanza_tormentas","hechicera_ignea","sacerdote_oscuro"], energy: 10,
                    specialAbility: "Cada turno elige aleatoriamente: +5 HP, invocar 2 tropas, o 4 daño directo" },
                rewards: { gold: 500, xp: 700, chestType: "cofre_abismo", isFinalBoss: true },
                repeatRewards: { gold: 150, xp: 200 }
            }
        ]
    }
}

// Conexiones entre nodos (qué nodo desbloquea cuál)
export const NODE_CONNECTIONS = {
    z1n1: ["z1n2"],
    z1n2: ["z1n3","z1n4"],
    z1n3: ["z1n5"],
    z1n4: ["z1n5","z1n6"],
    z1n5: ["z1n6","z1n7"],
    z1n6: ["z1n8"],
    z1n7: ["z1n8"],
    z1n8: ["z1n9"],
    z1n9: ["z1n10"],
    z1n10: [],

    z2n1: ["z2n2"],
    z2n2: ["z2n3","z2n4"],
    z2n3: ["z2n5"],
    z2n4: ["z2n5","z2n6"],
    z2n5: ["z2n7"],
    z2n6: ["z2n7"],
    z2n7: ["z2n8","z2n9"],
    z2n8: ["z2n10"],
    z2n9: ["z2n10"],
    z2n10: [],

    z3n1: ["z3n2"],
    z3n2: ["z3n3","z3n4"],
    z3n3: ["z3n5"],
    z3n4: ["z3n5"],
    z3n5: ["z3n6","z3n7"],
    z3n6: ["z3n8"],
    z3n7: ["z3n8"],
    z3n8: ["z3n9"],
    z3n9: ["z3n10"],
    z3n10: [],

    z4n1: ["z4n2"],
    z4n2: ["z4n3","z4n4"],
    z4n3: ["z4n5"],
    z4n4: ["z4n5","z4n6"],
    z4n5: ["z4n7"],
    z4n6: ["z4n7"],
    z4n7: ["z4n8","z4n9"],
    z4n8: ["z4n10"],
    z4n9: ["z4n10"],
    z4n10: []
}

export const NODE_TYPE_CONFIG = {
    combat: { icon: "⚔️", label: "Combate",  color: "#e74c3c", size: 44 },
    elite:  { icon: "💀", label: "Élite",    color: "#9b59b6", size: 52 },
    boss:   { icon: "☠️", label: "Jefe",     color: "#c0392b", size: 62 },
    event:  { icon: "❓", label: "Evento",   color: "#3498db", size: 40 },
    shop:   { icon: "🏪", label: "Tienda",   color: "#f39c12", size: 40 },
}