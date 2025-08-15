// battle-spirits-server/game_logic/greenDeck.js
const pathsSpirit = './images/card_green/spirit'; // สมมติว่ามีโฟลเดอร์นี้

module.exports.greenCards = [
    {
        id: 'card-gabunohashi',
        name: 'Gabunohashi',
        quantity: 40,
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
   
];