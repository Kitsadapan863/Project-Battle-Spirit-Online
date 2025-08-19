// battle-spirits-server/game_logic/whiteDeck.js
const pathsSpirit = './images/card_white/spirit'; 
const pathsMagic = './images/card_white/magic'; 
const pathsNexus = './images/card_white/nexus'; 

module.exports.whiteCards = [
    {
        id: "card-artifact-fjalar",
        name: "The Artifact Fjalar",
        image: `${pathsSpirit}/The Artifact Fjalar.webp`,
        quantity: 40,
        cost: 3,
        symbol_cost: { "white": 1 },
        level: { 
            'level-1': { core: 1, bp: 2000 }, 
            'level-2': { core: 2, bp: 4000 },
            'level-3': { core: 4, bp: 5000 }
        },
        type: "Spirit", 
        color: "white",
        family: ["Armed Machine", "Android"],
        effects: [
            {
                level: [1, 2, 3],
                timing: "permanent",
                keyword: "armor",
                colors: ["red", "green"],
                description: "[LV1][LV2][LV3] [Armor: Red/Green]\nThis Spirit is unaffected by opposing Red/Green Spirit/Nexus/Magic effects."
            },
            {
                level: [1, 2, 3],
                timing: "flash",
                keyword: "flash_exhaust_self_for_bp_boost",
                effect: {
                    power: "this_bp",
                    duration: "turn"
                },
                target: {
                    scope: "player",
                    type: "spirit",
                    family: ["Armed Machine"],
                    count: 1
                },
                description: "[LV1][LV2][LV3] (Flash)\nBy exhausting this Spirit, during this turn, give an \"Armed Machine\" family Spirit you control +BP equal to this Spirit's BP."
            }
        ],
        symbol: { "white": 1 }
    }
];