const pathsSpirit = './images/cards_red/spirit'
const pathsNexus = './images/cards_red/nexus'
const pathsMagic = './images/cards_red/magic'

module.exports.redCards = [
    //spirit
    {
        id: 'card-scout-dragno',
        name: 'The Scout Dragno',
        quantity: 0,
        image: `${pathsSpirit}/The Scout Dragno.webp`,
        cost: 2,
        symbol_cost: { "red": 1 },
        level: { "level-1": { "core": 1, "bp": 2000 }, "level-2": { "core": 2, "bp": 3000 } },
        type: 'Spirit', color: 'red',
        family: ["Dragon"],
        effects: [
            { level: [1, 2], timing: 'whenAttacks', keyword: 'power up', power: 2000, duration: 'turn', description: "[LV1][LV2]\n(When Attacks)\nThis spirit gets + 2000BP until end of turn." }
        ],
        symbol: { "red": 1 },
    },
    {
        id: 'card-rokceratops',
        name: `Rokceratops`,
        quantity: 3,
        image: `${pathsSpirit}/Rokceratops.webp`,
        cost: 1,
        symbol_cost: { "red": 1 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 2, "bp": 3000 }, "level-3": { "core": 3, "bp": 4000 } },
        type: 'Spirit', color: 'red',
        family: ["Terra Dragon"],
        effects: [],
        symbol: { "red": 1 },
    },
    {
        id: 'card-lizardedge',
        name: `Lizardedge`,
        quantity: 3,
        image: `${pathsSpirit}/Lizardedge.webp`,
        cost: 0,
        symbol_cost: { "red": 0 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 2, "bp": 2000 }, "level-3": { "core": 4, "bp": 4000 } },
        type: 'Spirit', color: 'red',
        family: ["Reptile Beast"],
        effects: [],
        symbol: { "red": 1 },
    },
    {
        id: 'card-lizardedge',
        name: `Lizardedge`,
        quantity: 3,
        image: `${pathsSpirit}/Lizardedge.webp`,
        cost: 0,
        symbol_cost: { "red": 0 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 2, "bp": 2000 }, "level-3": { "core": 4, "bp": 4000 } },
        type: 'Spirit', color: 'red',
        family: ["Reptile Beast"],
        effects: [],
        symbol: { "red": 1 },
    },
    {
        id: 'card-goradon',
        name: `Goradon`,
        quantity: 3,
        image: `${pathsSpirit}/Goradon.webp`,
        cost: 0,
        symbol_cost: { "red": 0 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 3, "bp": 3000 }},
        type: 'Spirit', color: 'red',
        family: ["Reptile Beast"],
        effects: [],
        symbol: { "red": 1 },
    },
    {
        id: 'card-rainydle',
        name: `Rainydle`,
        quantity: 3,
        image: `${pathsSpirit}/Rainydle.webp`,
        cost: 1,
        symbol_cost: { "red": 1 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 2, "bp": 3000 },"level-3": { "core": 3, "bp": 4000 }},
        type: 'Spirit', color: 'red',
        family: ["Astral Dragon"],
        effects: [],
        symbol: { "red": 1 },
    },
    {
        id: 'card-dinonychusaw',
        name: `Dinonychusaw`,
        quantity: 3,
        image: `${pathsSpirit}/Dinonychusaw.webp`,
        cost: 1,
        symbol_cost: { "red": 1 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 3, "bp": 4000 }},
        type: 'Spirit', color: 'red',
        family: ["Terra Dragon"],
        effects: [],
        symbol: { "red": 1 },
    },
    {
        id: 'card-ovirapt',
        name: `Ovirapt`,
        quantity: 1,
        image: `${pathsSpirit}/Ovirapt.webp`,
        cost: 1,
        symbol_cost: { "red": 1 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 2, "bp": 3000 }},
        type: 'Spirit', color: 'red',
        family: ["Terra Dragon"],
        effects: [
        { 
            level: [1, 2], 
            timing: 'whenSummoned', 
            keyword: 'aura_power_up', // << เปลี่ยนจาก 'power up'
            power: 1000, 
            targetFamily: "Terra Dragon", // << เพิ่ม property นี้
            duration: 'turn', 
            description: '[LV1][LV2]\n(When Summoned)\nDuring this turn, every "Terra Dragon" family Spirit you control gains +1000 BP.' 
        },
    ],
        symbol: { "red": 1 },
    },
    {
        id: 'card-wingDragman-pteradia',
        name: `The WingDragman Pteradia`,
        quantity: 3,
        image: `${pathsSpirit}/The WingDragman Pteradia.webp`,
        cost: 2,
        symbol_cost: { "red": 1 },
        level: { "level-1": { "core": 1, "bp": 1000 }, "level-2": { "core": 2, "bp": 3000 }, "level-3": { "core": 4, "bp": 5000 }},
        type: 'Spirit', color: 'red',
        family: ["Dragon", "Winged Dragon"],
        effects: [
            { level: [1, 2, 3], timing: 'flash', keyword: 'Evolution', 
            description: '[LV1][LV2][LV3] Flash:[Evolution]\nYou can put any number of cores from Spirits you control to this Spirit.' },
        ],
        symbol: { "red": 1 },
    },
    {
        id: 'card-horngrizzly',
        name: `The FierceHeadBeast Horngrizzly`,
        quantity: 3,
        image: `${pathsSpirit}/The FierceHeadBeast Horngrizzly.webp`,
        cost: 3,
        symbol_cost: { "red": 1 },
        level: { "level-1": { "core": 1, "bp": 3000 }, "level-2": { "core": 3, "bp": 5000 }, "level-3": { "core": 5, "bp": 6000 }},
        type: 'Spirit', color: 'red',
        family: ["Emperor Beast"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', keyword: 'clash', 
            description: "[LV1][LV2][LV3] [Clash]\n(When Attacks)\nThe opponent must block if possible." }
        ],
        symbol: { "red": 1 },
    },
    {
        id: 'card-sabecaulus',
        name: `Sabecaulus`,
        quantity: 3,
        image: `${pathsSpirit}/Sabecaulus.webp`,
        cost: 4,
        symbol_cost: { "red": 2 },
        level: { "level-1": { "core": 1, "bp": 3000 }, "level-2": { "core": 3, "bp": 4000 }, "level-3": { "core": 4, "bp": 7000 }},
        type: 'Spirit', color: 'red',
        family: ["Terra Dragon"],
        effects: [
            { level: [1, 2, 3], timing: 'flash', keyword: 'Evolution', 
            description: '[LV1][LV2][LV3] Flash:[Evolution]\nYou can put any number of cores from Spirits you control to this Spirit.' },
            {level: [2, 3], timing: 'yourAttackStep', keyword:'power up', power:1000, condition:['clash'],
            description:'[LV2][LV3]\n(Your Attack Step)\nAll your Spirits with [Clash] gain +1000 BP'
            }
        ],
        symbol: { "red": 1 },
    },
    {
        id: 'card-siegwurm',
        name: 'The ThunderEmperorDragon Siegwurm',
        quantity: 3,
        image: `${pathsSpirit}/The ThunderEmperorDragon Siegwurm.webp`,
        cost: 6,
        symbol_cost: { "red": 3 },
        level: { "level-1": { "core": 1, "bp": 4000 }, "level-2": { "core": 3, "bp": 6000 }, "level-3": { "core": 5, "bp": 9000 } },
        type: 'Spirit', color: 'red',
        family: ["Astral Dragon", "Ancient Dragon"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', keyword: 'clash', description: "[LV1][LV2][LV3] [Clash]\n(When Attacks)\nThe opponent must block if possible." },
            { level: [3], timing: 'yourAttackStep', keyword: 'addEffects', condition:['Evolution'], add_keyword:['clash'],
            description: "[LV3]\n(Your Attack Step)\nGive every Spirit with [Evolution] you control: [Clash]." }
        ],
        symbol: { "red": 1 },
    },
    {
        id: 'card-meteorwurm',
        name: 'The StarEmperorDragon Meteorwurm',
        quantity: 3,
        image: `${pathsSpirit}/The StarEmperorDragon Meteorwurm.webp`,
        cost: 7,
        symbol_cost: { "red": 3 },
        level: { "level-1": { "core": 1, "bp": 6000 }, "level-2": { "core": 3, "bp": 7000 }, "level-3": { "core": 6, "bp": 11000 } },
        type: 'Spirit', color: 'red',
        family: ["Astral Dragon", "Soldier"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', keyword: 'clash', description: "[LV1][LV2][LV3] [Clash]\n(When Attacks)\nThe opponent must block if possible." },
            { level: [2, 3], timing: 'yourAttackStep', keyword: 'addEffects', condition:['Soldier'], add_keyword:['clash'],
            description: "[LV2][LV3]\n(Your Attack Step)\nGive all your 'Soldier' family Spirits: [Clash]." },
            { level: [3], timing: 'yourAttackStep', keyword: 'targetAndAttack', condition:['clash'],
            description: "[LV3]\n(Your Attack Step)\nWhen your Spirit with [Clash] attacks, you can target and attack an opposing Spirit." },
        ],
        symbol: { "red": 1 },
    },

    //magic
    {
        id: 'magic-double-draw',
        name: 'Double Draw',
        quantity: 2,
        image: `${pathsMagic}/Double Draw.webp`,
        cost: 4,
        symbol_cost: { "red": 2 },
        type: 'Magic',
        color: 'red',
        effects: [
            { timing: 'main', keyword: 'draw', quantity: 2, description: '[Main]\nDraw 2 cards from your deck.' },
            {
                timing: 'flash', keyword: 'power up', power: 2000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +2000 BP.'
            }
        ],
    },
    {
        id: 'magic-big-bang-energy',
        name: 'Big Bang Energy',
        quantity: 3,
        image: `${pathsMagic}/Big Bang Energy.webp`,
        cost: 4,
        symbol_cost: { "red": 2 },
        type: 'Magic',
        color: 'red',
        effects: [
            { timing: 'main', keyword: 'change cost', condition_effect:'life your', condition:['Astral Dragon'], 
                description: '[Main]\nDuring this turn, the cost of all "Astral Dragon" family Spirit cards in your Hand become the same number as your Life.' },
            {
                timing: 'flash', keyword: 'power up', power: 2000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +2000 BP.'
            }
        ],
    },
    {
        id: 'magic-buster-javelin',
        name: 'Buster Javelin',
        quantity: 1,
        image: `${pathsMagic}/Buster Javelin.webp`,
        cost: 3,
        symbol_cost: { "red": 1 },
        type: 'Magic',
        color: 'red',
        effects: [
            { timing: 'main', keyword: 'destroy', target: {count: 1, type: 'nexus', scope: 'opponent', succeed:'draw', quantity:1} , 
                description: '[Main]\nDestroy a Nexus. If an opposing Nexus is destroyed, draw a card.' },
            {
                timing: 'flash', keyword: 'power up', power: 2000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +2000 BP.'
            }
        ],
    },
    {
        id: 'magic-extra-draw',
        name: 'Extra Draw',
        quantity: 3,
        image: `${pathsMagic}/Extra Draw.webp`,
        cost: 5,
        symbol_cost: { "red": 3 },
        type: 'Magic',
        color: 'red',
        effects: [
            { timing: 'main', keyword: 'draw', quantity: 2, succeed:'show', type:'spirit', color:['red'] ,
              description: '[Main]\nDraw 2 cards. Then, reveal a card from your decktop. If that card is a Red Spirit card, add it to your Hand. Return any remaining card to the decktop.' },
            {
                timing: 'flash', keyword: 'power up', power: 2000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +2000 BP.'
            }
        ],
    },
    {
        id: 'magic-offensive-aura',
        name: 'Offensive Aura',
        quantity: 2,
        image: `${pathsMagic}/Offensive Aura.webp`,
        cost: 4,
        symbol_cost: { "red": 2 },
        type: 'Magic',
        color: 'red',
        effects: [
                   { 
            timing: 'flash', 
            keyword: 'conditional_aura_power_up', // << Keyword ใหม่
            duration: 'battle',
            // กำหนดเงื่อนไขและค่าพลังแยกกัน
            buffs: [
                { condition: { hasKeyword: 'clash' }, power: 2000 },
                { condition: { hasNotKeyword: 'clash' }, power: 2000 }
            ],
            description: '[Flash]\nDuring this turn, all your attacking Spirits gain +2000 BP.' 
        },
        ],
    },
    {
        id: 'magic-meteor-storm',
        name: 'Meteor Storm',
        quantity: 3,
        image: `${pathsMagic}/Meteor Storm.webp`,
        cost: 4,
        symbol_cost: { "red": 2 },
        type: 'Magic',
        color: 'red',
        effects: [
            { timing: 'flash', keyword: 'addEffects', condition:['wurm'] , duration: 'turn', add_keyword:['destroy_life'],
               
                description: '[Flash]\nDuring this turn, give a "Wurm"-named Spirit you control: "(When Attacks) When only the opposing Spirit is destroyed via BP comparison, send a number of cores from the opposing Life to their Reserve equal to the number of symbols this Spirit has."' },
        ],
    },
]