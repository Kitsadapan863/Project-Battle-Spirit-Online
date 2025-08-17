// battle-spirits-server/game_logic/greenDeck.js
const pathsSpirit = './images/card_green/spirit'; // สมมติว่ามีโฟลเดอร์นี้

module.exports.greenCards = [
    {
        id: 'card-gabunohashi',
        name: 'Gabunohashi',
        quantity: 3,
        image: `${pathsSpirit}/Gabunohashi.webp`, // Path to the uploaded image
        cost: 3,
        symbol_cost: { "green": 1 },
        level: { 
            "level-1": { "core": 1, "bp": 1000 }, 
            "level-2": { "core": 3, "bp": 5000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Plant Spirit"],
        effects: [
            {
                level: [1, 2],
                // Timing ที่ถูกต้องคือ 'whenBlocked' ไม่ใช่ 'whenAttacks'
                timing: 'whenBlocked', 
                keyword: 'windstorm', 
                target: {
                    scope: 'opponent',
                    type: 'spirit',
                    count: 1,
                    isExhausted: false // เพิ่มเงื่อนไข: เลือกได้เฉพาะตัวที่ยังไม่เหนื่อย
                },
                description: "[LV1][LV2] [Windstorm: 1] (When Attacks)\nWhen this Spirit is blocked, exhaust 1 opposing Spirit."
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'card-machg',
        name: 'Mach G',
        quantity: 3,
        image: `${pathsSpirit}/Mach G.webp`, // Path to the uploaded image
        cost: 1,
        symbol_cost: { "green": 0 },
        level: { 
            "level-1": { "core": 1, "bp": 2000 }, 
            "level-2": { "core": 3, "bp": 3000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Parasite Bug"],
        effects: [
            {
                timing: 'flash',
                keyword: 'high_speed',
                description: "[LV1][LV2] [High Speed] (Flash Step)\nThis Spirit card can be summoned from your hand during the Flash Step. The cost and cores to be placed on this Spirit must be paid from your Reserve."
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'card-byak-garo',
        name: 'The BladeKingBeast Byak-Garo',
        quantity: 34,
        image: `${pathsSpirit}/The BladeKingBeast Byak-Garo.webp`, // Path to the uploaded image
        cost: 6,
        symbol_cost: { "green": 3 },
        level: { 
            "level-1": { "core": 1, "bp": 7000 }, 
            "level-2": { "core": 4, "bp": 9000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Blade Beast"],
        effects: [
            {
                level: [1, 2],
                // Timing ที่ถูกต้องคือ 'whenBlocked' ไม่ใช่ 'whenAttacks'
                timing: 'whenBlocked', 
                keyword: 'windstorm', 
                target: {
                    scope: 'opponent',
                    type: 'spirit',
                    count: 1,
                    isExhausted: false // เพิ่มเงื่อนไข: เลือกได้เฉพาะตัวที่ยังไม่เหนื่อย
                },
                description: "[LV1][LV2] [Windstorm: 1] (When Attacks)\nWhen this Spirit is blocked, exhaust 1 opposing Spirit."
            },
            {
            level: [2],
            timing: 'onLifeDamageDealt', // ทำงานเมื่อ Spirit นี้โจมตีลด Life สำเร็จ
            keyword: 'return_to_hand_with_cost', // Keyword ใหม่สำหรับความสามารถนี้โดยเฉพาะ
            cost: { // ระบุค่าใช้จ่ายในการใช้งาน
                type: 'core',
                from: 'reserve',
                to: 'trash',
                count: 1
            },
            target: { // ระบุเป้าหมายของเอฟเฟกต์
                scope: 'opponent',
                type: 'spirit',
                count: 2,
                condition: { // เงื่อนไขเพิ่มเติมสำหรับเป้าหมาย
                    lacks_keyword: 'tribute' // ต้องไม่มีความสามารถ Tribute (煌臨)
                }
            },
            description: "[LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, by sending a core from your Reserve to your Trash, return two opposing Spirits without Tribute to the Hand."
        }
        ],
        symbol: { "green": 1 },
    },
   
];