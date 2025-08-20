// battle-spirits-server/game_logic/whiteDeck.js
const pathsSpirit = './images/card_white/spirit'; 
const pathsMagic = './images/card_white/magic'; 
const pathsNexus = './images/card_white/nexus'; 

module.exports.whiteCards = [
    {
        id: "card-artifact-fjalar",
        name: "The Artifact Fjalar",
        image: `${pathsSpirit}/The Artifact Fjalar.webp`,
        quantity: 3,
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
    },
    {
        id: "card-ironknight-yggdrasill",
        name: "The IronKnight Yggdrasill",
        image: `${pathsSpirit}/The IronKnight Yggdrasill.webp`,
        quantity: 1,
        cost: 6,
        symbol_cost: { "white": 3 },
        level: { 
            "level-1": { "core": 1, "bp": 5000 }, 
            "level-2": { "core": 3, "bp": 7000 },
            "level-3": { "core": 4, "bp": 9000 }
        },
        type: "Spirit", 
        color: "white",
        family: ["Machine", "Mounted Warrior"],
        effects: [
            {
                level: [1, 2, 3],
                timing: "whenSummoned",
                keyword: "mass_return_to_hand_by_bp",
                bpOrLess: 3000,
                description: "[LV1][LV2][LV3] (When Summoned)\nReturn every 3000 BP or less Spirit to the Hand."
            },
            {
                level: [2, 3],
                timing: "permanent",
                keyword: "aura_grant_immunity",
                target_filter: {
                    color: "white",
                    type: "spirit"
                },
                colors: ["red", "white"],
                description: `[LV2][LV3] \nGive every White Spirit you control: "[Armor: Red/White] - This Spirit is unaffected by opposing Red/White Spirit/Nexus/Magic effects."`
            }
        ],
        symbol: { "white": 1 }
    },
    {
        id: "card-wingdeity-grand-woden",
        name: "The WingDeity Grand-Woden",
        image: `${pathsSpirit}/The WingDeity Grand-Woden.webp`,
        quantity: 1,
        cost: 8,
        symbol_cost: { "white": 5 },
        level: { 
            "level-1": { "core": 1, "bp": 8000 }, 
            "level-2": { "core": 3, "bp": 9000 },
            "level-3": { "core": 4, "bp": 10000 }
        },
        type: "Spirit", 
        color: "white",
        family: ["Armed Machine", "Mounted Warrior"],
        effects: [
            {
                level: [1, 2, 3],
                timing: "onSummon",
                keyword: "tribute",
                destination: "void",
                condition: {
                    type: "spirit",
                    costOrMore: 5
                },
                description: "Tribute: Cost 5 or more -> Void\nAfter paying for the summoning cost, you must send all core from a Cost 5 or more Spirits you control to the Void."
            },
            {
                level: [1, 2, 3],
                timing: "onOpponentMagicUse",
                keyword: "ice_wall",
                cost: {
                    type: "exhaust_self"
                },
                negatable_colors: ["red", "purple", "green", "white", "yellow", "blue"],
                description: "[LV1][LV2][LV3] Ice Wall: All Colors (Opposing Turn)\nWhen the opponent uses a Magic effect of any color, by exhausting this Spirit, negate that effect."
            },
            {
                level: [2, 3],
                timing: "onFriendlySpiritExhausted",
                keyword: "refresh_self",
                condition: {
                    type: "spirit",
                    family: "Armed Machine",
                    isNotSelf: true
                },
                description: "[LV2][LV3]\nWhen another of your \"Armed Machine\" family Spirits becomes exhausted, refresh this Spirit."
            }
        ],
        symbol: { "white": 2 }
    },
    {
        id: "card-armored-sacred-walhalance",
        name: "The ArmoredSacred Walhalance",
        image: `${pathsSpirit}/The ArmoredSacred Walhalance.webp`,
        quantity: 10,
        cost: 7,
        symbol_cost: { "white": 3 },
        level: { 
            "level-1": { core: 1, bp: 6000 }, 
            "level-2": { core: 3, bp: 7000 },
            "level-3": { core: 5, bp: 10000 }
        },
        type: "Spirit", 
        color: "white",
        family: ["Armed Machine", "Mounted Warrior"],
        effects: [
            {
                level: [1, 2, 3],
                timing: "permanent",
                keyword: "immunity",
                colors: "opponent_symbols",
                description: "[LV1][LV2][LV3] [Immunity: ∞]\nThis Spirit is unaffected by the effects of cards your opponent controls that share a color with any of the Gems on their Field."
            },
            {
                level: [2, 3],
                timing: "onBattleStart",
                keyword: "boost_bp_by_exhausting_ally",
                target: {
                    scope: "player",
                    type: "spirit",
                    family: ["Armed Machine"],
                    count: 1
                },
                duration: "battle",
                description: "[LV2][LV3] (When Battles)\nYou may exhaust an \"Armed Machine\" family Spirit you control. In that case, that exhausted Spirit's BP is added to this spirit's BP until end of battle."
            },
            {
                level: [3],
                timing: "whenAttacks",
                keyword: "mass_return_opponent_to_hand_by_bp",
                bpOrLess: 4000,
                description: "[LV3] (When Attacks)\nMove all spirits your opponent controls with 4000BP or less to their owner's hand."
            }
        ],
        symbol: { "white": 1 }
    }
];