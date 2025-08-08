
const paths = './images'

module.exports.opponentCards  = [
    {
        id: 'card-drakwurm-nova',
        name: 'The StarSlayerDragon Darkwurm Nova',
        quantity: 1,
        image: `${paths}/The StarSlayerDragon Darkwurm Nova.webp`,
        cost: 7,
        symbol_cost: { "purple": 4 },
        level: { "level-1": { "core": 1, "bp": 5000 }, "level-2": { "core": 3, "bp": 8000 }, "level-3": { "core": 5, "bp": 13000 } },
        type: 'Spirit', color: 'purple',
        family: ["Astral Dragon", "Nightling"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', description: 'Destroy 1 opposing Spirit with 5000 BP or less.' }
        ],
        symbol: { "purple": 2 },
    },
    {
        id: 'card-siegwurm',
        name: 'The ThunderEmperorDragon Siegwurm',
        quantity: 3,
        image: `${paths}/The ThunderEmperorDragon Siegwurm.webp`,
        cost: 6,
        symbol_cost: { "red": 3 },
        level: { "level-1": { "core": 1, "bp": 4000 }, "level-2": { "core": 3, "bp": 6000 }, "level-3": { "core": 5, "bp": 9000 } },
        type: 'Spirit', color: 'red',
        family: ["Astral Dragon", "Ancient Dragon"],
        effects: [
            { level: [1, 2, 3], timing: 'whenAttacks', keyword: 'clash', description: "[LV1][LV2][LV3] [Clash]\n(When Attacks)\nThe opponent must block if possible." }
        ],
        symbol: { "red": 1 },
    },
    {
        id: 'card-scout-dragno',
        name: 'The Scout Dragno',
        quantity: 15,
        image: `${paths}/The Scout Dragno.webp`,
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
        id: 'card-strike-siegwurm',
        name: 'The Moonlight Dragon Strike Siegwurm',
        quantity: 1,
        image: `${paths}/The_Moonlight_Dragon_Strike_Siegwurm.webp`,
        cost: 6,
        symbol_cost: { "white": 3 },
        level: { "level-1": { "core": 1, "bp": 5000 }, "level-2": { "core": 3, "bp": 8000 }, "level-3": { "core": 4, "bp": 10000 } },
        type: 'Spirit', color: 'white',
        family: ["Astral Deity", "Armed Machine"],
        effects: [
            { level: [1, 2, 3], timing: 'whenSummoned', description: 'Destroy 1 opposing Spirit with 6000 BP or less.' }
        ],
        symbol: { "white": 1 },
    },
    {
        id: 'card-rock-golem',
        name: 'Rock-Golem',
        quantity: 3,
        image: `${paths}/Rock-Golem.webp`,
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
    {
        id: 'card-gigantic-thor',
        name: 'The Gigantic Thor',
        quantity: 1,
        image: `${paths}/The Gigantic Thor.webp`,
        cost: 7,
        symbol_cost: { "white": 3 },
        level: { "level-1": { "core": 1, "bp": 4000 }, "level-2": { "core": 2, "bp": 6000 }, "level-3": { "core": 4, "bp": 8000 } },
        type: 'Spirit', color: 'white',
        family: ["Android", "Armed Machine"],
        effects: [
            { level: [1, 2, 3], timing: 'flash', description: '(Your Attack Step) This Spirit can block during opponent\'s attack step.' }
        ],
        symbol: { "white": 1 },
    },
    {
        id: 'card-castle-golem',
        name: 'The MobileFortress Castle-Golem',
        quantity: 1,
        image: `${paths}/The MobileFortress Castle-Golem.webp`,
        cost: 8,
        symbol_cost: { "blue": 4 },
        level: { "level-1": { "core": 1, "bp": 6000 }, "level-2": { "core": 6, "bp": 12000 } },
        type: 'Spirit', color: 'blue',
        family: ["Artificial Soldier"],
        effects: [
            { level: [1, 2], timing: 'whenSummoned', description: 'For each Nexus you control, discard five cards from the opposing decktop (Max 15).' },
            { level: [2], timing: 'whenAttacks', description: 'For each Blue symbol you control, discard a card from the opposing decktop.' }
        ],
        symbol: { "blue": 1 },
    },
    {
        id: 'magic-ice-age-shield',
        name: 'Ice Age Shield',
        quantity: 1,
        image: `${paths}/Ice Age Shield.webp`,
        cost: 2,
        symbol_cost: { "white": 1 },
        type: 'Magic',
        color: 'white',
        effects: [
            { timing: 'flash', description: 'End the Attack Step.' }
        ],
    },
    {
        id: 'magic-brave-draw',
        name: 'Brave Draw',
        quantity: 1,
        image: `${paths}/Brave Draw.webp`,
        cost: 5,
        symbol_cost: { "red": 3 },
        type: 'Magic',
        color: 'red',
        effects: [
            { timing: 'main', keyword: 'draw', quantity: 2, description: '[Main]\nDraw 2 cards from your deck.' },
            // Brave Draw ส่วนใหญ่จะเพิ่มพลังให้ฝั่งตัวเอง
            {
                timing: 'flash', keyword: 'power up', power: 2000, duration: 'battle',
                target: { scope: 'player', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this battle, 1 of your Spirits gets +2000 BP.'
            }
        ],
    },
    {
        id: 'magic-double-draw',
        name: 'Double Draw',
        quantity: 1,
        image: `${paths}/Double Draw.webp`,
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
        id: 'nexus-burning-canyon',
        name: 'The Burning Canyon',
        quantity: 20,
        image: `${paths}/The Burning Canyon.webp`,
        cost: 3,
        symbol_cost: { "red": 2 },
        level: { "level-1": { "core": 0 }, "level-2": { "core": 1 } },
        type: 'Nexus',
        color: 'red',
        effects: [
            { level: [1, 2], timing: 'onDrawStep',keyword: 'draw', quantity: 1, discard:1, description: '[LV1][LV2] (Your Draw Step)\nDraw 1 card. Then, discard 1 card.' },
            { level: [2], timing: 'duringBattle', keyword: 'power up', power: 1000, duration: 'attackStep', description: '[LV2] (Your Attack Step)\nSpirits you control get +1000BP.' }
        ],
        symbol: { "red": 1 },
    },
    {
        id: 'magic-victory-fire',
        name: 'Victory Fire',
        quantity: 3,
        image: `${paths}/Victory Fire.webp`,
        cost: 5,
        symbol_cost: { "red": 2 },
        type: 'Magic',
        color: 'red',
        effects: [
            {
                timing: 'flash',
                choiceId: 'vf_flash_choice', // <--- ID สำหรับจัดกลุ่ม Choice
                choiceText: 'ทำลาย Spirit BP<=3000 2 ใบ', // <--- ข้อความสำหรับแสดงบนปุ่มที่ Frontend
                keyword: 'destroy',
                target: {
                    count: 2,
                    type: 'Spirit',
                    scope: 'opponent',
                    bpOrLess: 3000
                },
                description: '[Flash]\nDestroy two opposing 3000 BP or less Spirits.'
            },
            {
                timing: 'flash',
                choiceId: 'vf_flash_choice', // <--- ID เดียวกันกับข้างบน
                choiceText: 'ทำลาย Spirit BP<=3000 1 ใบ และ Nexus 1 ใบ',
                keyword: 'destroy_combo', // <--- Keyword ใหม่สำหรับเป้าหมายหลายประเภท
                target: [ // <--- เปลี่ยน target เป็น Array
                    { count: 1, type: 'Spirit', scope: 'opponent', bpOrLess: 3000 },
                    { count: 1, type: 'Nexus', scope: 'opponent' }
                ],
                description: '[Flash]\nOr, destroy an opposing 3000 BP or less Spirit and an opposing Nexus.'
            }
        ],
    },
]