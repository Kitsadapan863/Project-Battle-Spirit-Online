
const pathsSpirit = './images/cards_blue/spirit'
const pathsNexus = './images/cards_blue/nexus'
const pathsMagic = './images/cards_blue/magic'

module.exports.playerCards = [
    //Rock-Golem
    {
        id: 'card-rock-golem',
        name: 'Rock-Golem',
        quantity: 3,
        image: `${pathsSpirit}/Rock-Golem.webp`,
        cost: 3,
        symbol_cost: { "blue": 2 },
        level: { "level-1": { "core": 1, "bp": 3000 }, "level-2": { "core": 2, "bp": 4000 }, "level-3": { "core": 4, "bp": 7000 } },
        type: 'Spirit', color: 'blue',
        family: ["Artificial Soldier"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', keyword: 'crush', description: "[LV1][LV2][LV3] [Crush]\n(When Attacks)\nMove cards from the top of your opponent's Deck to their trash equal to this spirit's LV." }
        ],
        symbol: { "blue": 1 },
    },
    //The MobileFortress Castle-Golem
    {
        id: 'card-castle-golem',
        name: 'The MobileFortress Castle-Golem',
        quantity: 3,
        image: `${pathsSpirit}/The MobileFortress Castle-Golem.webp`,
        cost: 8,
        symbol_cost: { "blue": 4 },
        level: { "level-1": { "core": 1, "bp": 6000 }, "level-2": { "core": 6, "bp": 12000 } },
        type: 'Spirit', color: 'blue',
        family: ["Artificial Soldier"],
        effects: [
            { level: [1, 2], timing: 'whenSummoned', keyword: 'discard', description: '[LV1][LV2] (When Summoned)\nFor each Nexus you control, discard five cards from the opposing decktop (Max 15).' },
            { level: [2], timing: 'whenAttacks', keyword: 'discard', description: '[LV2] (When Attacks)\nFor each Blue symbol you control, discard a card from the opposing decktop.' }
        ],
        symbol: { "blue": 1 },
    },
    //The GiantHero Titus
    {
        id: 'card-giantHero-titus',
        name: 'The GiantHero Titus',
        quantity: 3,
        image: `${pathsSpirit}/The GiantHero Titus.webp`,
        cost: 8,
        symbol_cost: { "blue": 4 },
        level: { "level-1": { "core": 1, "bp": 6000 }, "level-2": { "core": 4, "bp": 9000 } },
        type: 'Spirit', color: 'blue',
        family: ["Fighting Spirit", "Soldier"],
        effects: [
            { level: [1, 2], timing: 'whenSummoned', keyword: 'discard', count: 10, description: '[LV1][LV2] (When Summoned)\nDiscard 10 cards from the opposing decktop.' },
            { level: [2], timing: 'onOpponentDestroyedInBattle', keyword: 'discard', count: 10, description: '[LV2] (When Attacks)\nWhen this spirit destroys an opposing Spirit by BP comparison, discard 10 cards from the opposing decktop.' }
        ],
        symbol: { "blue": 1 },
    },

    // Steam-Golem
    {
        id: 'card-steam-golem',
        name: 'Steam-Golem',
        quantity: 1,
        image: `${pathsSpirit}/Steam-Golem.webp`,
        cost: 5,
        symbol_cost: { "blue": 3 },
        level: { "level-1": { "core": 1, "bp": 4000 }, "level-2": { "core": 4, "bp": 5000 }, "level-3": { "core": 5, "bp": 6000 } },
        type: 'Spirit', color: 'blue',
        family: ["Artificial Soldier"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', keyword: 'crush', description: "[LV1][LV2][LV3] [Crush]\n(When Attacks)\nMove cards from the top of your opponent's Deck to their trash equal to this spirit's LV." },
            { level: [2], timing: 'permanent', keyword: 'add crush', count: 1, description: "[LV2]\n(Permanent,)\nEach time 1 or more cards are moved from the top of your opponent's Deck to their Trash due to the effects of this spirit's Crush, increase that number by 1." },
            { level: [3], timing: 'permanent', keyword: 'add crush', count: 2, description: "[LV2]\n(Permanent,)\nEach time 1 or more cards are moved from the top of your opponent's Deck to their Trash due to the effects of this spirit's Crush, increase that number by 2." }
        ],
        symbol: { "blue": 1 },
    },
    //The ClawSword Lazarus
    {
        id: 'card-clawSword-lazarus',
        name: 'The ClawSword Lazarus',
        quantity: 3,
        image: `${pathsSpirit}/The ClawSword Lazarus.webp`,
        cost: 2,
        symbol_cost: { "blue": 1 },
        level: { "level-1": { "core": 1, "bp": 2000 }, "level-2": { "core": 2, "bp": 3000 }, "level-3": { "core": 4, "bp": 5000 } },
        type: 'Spirit', color: 'blue',
        family: ["Fighting Spirit"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', keyword: 'crush', description: "[LV1][LV2][LV3] [Crush]\n(When Attacks)\nMove cards from the top of your opponent's Deck to their trash equal to this spirit's LV." },
        ],
        symbol: { "blue": 1 },
    },
    //Stone-Statue
    {
        id: 'card-stone-statue',
        name: 'Stone-Statue',
        quantity: 3,
        image: `${pathsSpirit}/Stone-Statue.webp`,
        cost: 1,
        symbol_cost: { "blue": 1 },
        level: { "level-1": { "core": 1, "bp": 2000 }, "level-2": { "core": 4, "bp": 4000 } },
        type: 'Spirit', color: 'blue',
        family: ["Artificial Soldier"],
        effects: [
            { level: [1, 2], timing: 'whenSummoned', keyword: 'discard', count: 1, description: "[LV1][LV2] (When Summoned)\nMove the top card of your opponent's Deck to their Trash." },
        ],
        symbol: { "blue": 1 },
    },

    //The Two-Sword Ambrose
    {
        id: 'card-two-sword-ambrose',
        name: 'The Two-Sword Ambrose',
        quantity: 3,
        image: `${pathsSpirit}/The Two-Sword Ambrose.webp`,
        cost: 2,
        symbol_cost: { "blue": 1 },
        level: { "level-1": { "core": 1, "bp": 2000 }, "level-2": { "core": 3, "bp": 3000 }, "level-3": { "core": 4, "bp": 5000 } },
        type: 'Spirit', color: 'blue',
        family: ["Fighting Spirit"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', keyword: 'crush', description: "[LV1][LV2][LV3] [Crush]\n(When Attacks)\nMove cards from the top of your opponent's Deck to their trash equal to this spirit's LV." },
            { level: [2, 3], timing: 'whenAttacks', keyword: 'power up', power: 1000, triggered_by: 'crush', duration: 'turn', description: "[LV2][LV3]\n(When Attacks)\nFor each Spirit card discarded by this Spirit's [Crush] effect, this Spirit gains +1000 BP." }

        ],
        symbol: { "blue": 1 },
    },

    //The Soldier Gustav
    {
        id: 'card-soldier-gustav',
        name: 'The Soldier Gustav',
        quantity: 3,
        image: `${pathsSpirit}/The Soldier Gustav.webp`,
        cost: 1,
        symbol_cost: { "blue": 1 },
        level: { "level-1": { "core": 1, "bp": 2000 }, "level-2": { "core": 3, "bp": 4000 }, "level-3": { "core": 6, "bp": 6000 } },
        type: 'Spirit', color: 'blue',
        family: ["Artificial Soldier"],
        effects: [],
        symbol: { "blue": 1 },
    },

    //The BattleBeast Bulltop
    {
        id: 'card-battlebeast-bulltop',
        name: 'The BattleBeast Bulltop',
        quantity: 3,
        image: `${pathsSpirit}/The BattleBeast Bulltop.webp`,
        cost: 0,
        symbol_cost: { "blue": 0 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 3, "bp": 3000 } },
        type: 'Spirit', color: 'blue',
        family: ["Fighting Beast"],
        effects: [],
        symbol: { "blue": 1 },
    },

    //The BlastingGiant Douglas
    {
        id: 'card-blasting-giant-douglas',
        name: 'The BlastingGiant Douglas',
        quantity: 3, // กำหนดจำนวนตามต้องการ
        image: `${pathsSpirit}/The BlastingGiant Douglas.webp`, // แก้ไข path รูปภาพให้ถูกต้อง
        cost: 5,
        symbol_cost: { "blue": 3 },
        level: {
            "level-1": { "core": 1, "bp": 5000 },
            "level-2": { "core": 4, "bp": 6000 },
            "level-3": { "core": 5, "bp": 7000 }
        },
        type: 'Spirit',
        color: 'blue',
        family: ["Fighting Spirit"],
        effects: [
            {
                level: [1, 2, 3],
                timing: 'whenAttacks',
                keyword: 'crush',
                description: "[LV1][LV2][LV3] [Crush] (When Attacks)\nDiscard a number of cards equal to this Spirit's level from opposing decktop."
            },
            {
                level: [2, 3],
                timing: 'permanent', // เป็นความสามารถติดตัว
                keyword: 'destroy_on_crush', // Keyword ใหม่สำหรับเอฟเฟกต์นี้
                target: {
                    scope: 'opponent',
                    type: 'spirit',
                    costOrLess: 3, // เงื่อนไข: Cost 3 หรือน้อยกว่า
                    count: 1
                },
                description: "[LV2][LV3] (During Your Battle Phase)\nWhen this Spirit's Crush discards any Spirit card, destroy an opposing Cost 3 or less Spirit."
            }
        ],
        symbol: { "blue": 1 },
    },


    {
        id: 'card-giantemperor-alexander',
        name: 'The GiantEmperor Alexander',
        quantity: 20, // กำหนดจำนวนตามต้องการ
        image: `${pathsSpirit}/The GiantEmperor Alexander.webp`, // แก้ไข path รูปภาพให้ถูกต้อง
        cost: 6,
        symbol_cost: { "blue": 3 },
        level: {
            "level-1": { "core": 1, "bp": 6000 },
            "level-2": { "core": 5, "bp": 10000 }
        },
        type: 'Spirit',
        color: 'blue',
        family: ["Fighting Spirit", "Soldier"],
        effects: [
            {
                level: [1, 2],
                timing: 'whenAttacks', // ทำงานตอนโจมตี
                keyword: 'assault',
                count: 2, // ระบุจำนวนครั้งที่ใช้ได้
                description: "[LV1][LV2] [Assault: 2] (When Attacks)\nThis Spirit can, up to twice per turn, be refreshed by exhausting a Nexus you control."
            },
            {
                level: [2],
                timing: 'whenAttacks', // ทำงานตอนโจมตี
                keyword: 'destroy_and_crush_by_cost',
                target: {
                    scope: 'opponent',
                    type: 'spirit',
                    costOrLess: 4,
                    count: 1
                },
                description: "[LV2] (When Attacks)\nDestroy an opposing Cost 4 or less Spirit, and discard a number of cards from the opposing decktop equal to the cost of the destroyed opposing Spirit."
            }
        ],
        symbol: { "blue": 1 },
    },
    //Strong Draw
    {
        id: 'magic-strong-draw',
        name: 'Strong Draw',
        quantity: 3,
        image: `${pathsMagic}/Strong Draw.webp`,
        cost: 3,
        symbol_cost: { "blue": 2 },
        type: 'Magic',
        color: 'blue',
        effects: [
            { timing: 'main', keyword: 'draw', quantity: 3, discard: 2, description: '[Main]\nDraw 3 cards, then discard 2 cards from your Hand.' },
            {
                timing: 'flash', keyword: 'power up', power: 3000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +3000 BP.'
            }
        ],
    },
    //	Magic Hammer
    {
        id: 'magic-hammer',
        name: 'Magic Hammer',
        quantity: 2,
        image: `${pathsMagic}/Magic Hammer.webp`,
        cost: 4,
        symbol_cost: { "blue": 2 },
        type: 'Magic',
        color: 'blue',
        effects: [
            { timing: 'main', keyword: 'discard', quantity: 5, description: "[Main]\nMove the top 5 cards of your opponent's Deck to their Trash." },
            {
                timing: 'flash', keyword: 'power up', power: 3000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +3000 BP.'
            }
        ],
    },
    //Blitz
    {
        id: 'magic-blitz',
        name: 'Blitz',
        quantity: 2,
        image: `${pathsMagic}/Blitz.webp`,
        cost: 4,
        symbol_cost: { "blue": 2 },
        type: 'Magic',
        color: 'blue',
        effects: [
            { timing: 'main', keyword: 'core charge', buff_type: 'core_on_crush_attack', description: "[Main]\nDuring this turn, each time a spirit you control with Crush attacks, gain 1 core in your Trash." },
            {
                timing: 'flash', keyword: 'power up', power: 3000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +3000 BP.'
            }
        ],
    },
    //Construction
    {
        id: 'magic-construction',
        name: 'Construction',
        quantity: 3,
        image: `${pathsMagic}/Construction.webp`,
        cost: 6,
        symbol_cost: { "blue": 3 },
        type: 'Magic',
        color: 'blue',
        effects: [
            { timing: 'main', keyword: 'deploy_from_trash', targetColors: ['red', 'green', 'blue'], description: "[Main]\nDeploy every Red/Green/Blue Nexus cards from your Trash, without paying the costs" },
            {
                timing: 'flash', keyword: 'power up', power: 3000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +3000 BP.'
            }
        ],
    },
    //The Collapse of Battle Line
    {
        id: 'nexus-battle-line',
        name: 'The Collapse of Battle Line',
        quantity: 15,
        image: `${pathsNexus}/The Collapse of Battle Line.webp`,
        cost: 4,
        symbol_cost: { "blue": 2 },
        level: { "level-1": { "core": 0 }, "level-2": { "core": 4 } },
        type: 'Nexus',
        color: 'blue',
        effects: [
            { level: [1, 2], timing: 'permanent', keyword: 'add crush', count: 2, description: '[LV1][LV2] (Either Attack Step)\nWhen discarding cards from the opposing deck via [Crush] effects, discard +2 cards.' },
            { level: [2], timing: 'duringBattle', keyword: 'force_max_level_on_crush', description: '[LV2] (Your Attack Step)\nEvery Spirit with [Crush] you control is treated as being on its highest level.' }
        ],
        symbol: { "blue": 1 },
    },
    //The H.Q. filled with Fighting Spirits
    {
        id: 'nexus-hq-fighting-spirits',
        name: 'The H.Q. filled with Fighting Spirits',
        quantity: 3,
        image: `${pathsNexus}/The H.Q. filled with Fighting Spirits.webp`,
        cost: 4,
        symbol_cost: { "blue": 3 },
        level: { "level-1": { "core": 0 }, "level-2": { "core": 3 } },
        type: 'Nexus',
        color: 'blue',
        effects: [
            { level: [1, 2], timing: 'permanent', keyword: 'enable_crush_on_block', description: "[LV1][LV2] (Opponent's Attack Step)\nYour Spirits' [Crush] effects also activate at (When Blocks)." },
            { level: [2], timing: 'permanent', keyword: 'core_on_crush', count: 1, description: "[LV2] (Either Attack Step)\nWhen cards are discarded from the opposing deck via [Crush] effects, put a core from the Void to your Reserve." }
        ],
        symbol: { "blue": 1 },
    },
]