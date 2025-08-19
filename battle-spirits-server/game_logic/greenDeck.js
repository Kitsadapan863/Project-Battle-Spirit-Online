// battle-spirits-server/game_logic/greenDeck.js
const pathsSpirit = './images/card_green/spirit'; 
const pathsMagic = './images/card_green/magic'; 
const pathsNexus = './images/card_green/nexus'; 

module.exports.greenCards = [
    {
        id: 'card-gabunohashi',
        name: 'Gabunohashi',
        quantity: 3,
        image: `${pathsSpirit}/Gabunohashi.webp`,
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
                timing: 'whenBlocked', 
                keyword: 'windstorm', 
                target: {
                    scope: 'opponent',
                    type: 'spirit',
                    count: 1,
                    isExhausted: false 
                },
                description: "[LV1][LV2] [Windstorm: 1] (When Attacks)\nWhen this Spirit is blocked, exhaust 1 opposing Spirit."
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'card-shiningWings-jewelgΣ',
        name: 'The ShiningWings JewelgΣ',
        quantity: 3,
        image: `${pathsSpirit}/The ShiningWings JewelgΣ.webp`,
        cost: 7,
        symbol_cost: { "green": 4 },
        level: { 
            "level-1": { "core": 1, "bp": 6000 }, 
            "level-2": { "core": 4, "bp": 10000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Shellman"],
        effects: [
            {
                level: [1, 2],
                timing: 'onSummon', 
                keyword: 'tribute',
                destination: 'costTrash',
                condition: {
                    type: 'spirit',
                    costOrMore: 3 
                },
                description: "Tribute: Cost 3 or more -> Trash\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Void."
            },
            {
                level: [1, 2],
                timing: 'whenBlocked', 
                keyword: 'windstorm', 
                target: {
                    scope: 'opponent',
                    type: 'spirit',
                    count: 2,
                    isExhausted: false 
                },
                description: "[LV1][LV2] [Windstorm: 2] (When Attacks)\nWhen this Spirit is blocked, exhaust 1 opposing Spirit."
            },
            {
                level: [2],
                timing: 'onLifeDamageDealt', 
                keyword: 'deal_life_damage', 
                damage: 1,
                description: "[LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, send a core from the opposing Life to their Reserve"
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'card-rakudacho',
        name: 'Rakudacho',
        quantity: 1,
        image: `${pathsSpirit}/Rakudacho.webp`,
        cost: 3,
        symbol_cost: { "green": 2 },
        level: { 
            "level-1": { "core": 1, "bp": 1000 }, 
            "level-2": { "core": 3, "bp": 3000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Imp"],
        effects: [
            {
                level: [1, 2],
                timing: 'whenBlocked', 
                keyword: 'windstorm', 
                target: {
                    scope: 'opponent',
                    type: 'spirit',
                    count: 1,
                    isExhausted: false 
                },
                description: "[LV1][LV2] [Windstorm: 1] (When Attacks)\nWhen this Spirit is blocked, exhaust 1 opposing Spirit."
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'card-dio-mantis',
        name: 'Dio-Mantis',
        quantity: 1,
        image: `${pathsSpirit}/Dio-Mantis.webp`,
        cost: 2,
        symbol_cost: { "green": 1 },
        level: { 
            "level-1": { "core": 1, "bp": 3000 }, 
            "level-2": { "core": 3, "bp": 5000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Parasite"],
        effects: [],
        symbol: { "green": 1 },
    },
    {
        id: 'card-airCommodore-geran',
        name: 'The AirCommodore Geran',
        quantity: 2,
        image: `${pathsSpirit}/The AirCommodore Geran.webp`,
        cost: 4,
        symbol_cost: { "green": 2 },
        level: { 
            "level-1": { "core": 1, "bp": 3000 }, 
            "level-2": { "core": 4, "bp": 6000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Winged Beast", "Deified General"],
        effects: [
            {
                level: [1, 2], timing: 'whenBlocked', keyword: 'windstorm', 
                target: { scope: 'opponent', type: 'spirit', count: 1, isExhausted: false },
                description: "[LV1][LV2] [Windstorm: 1] (When Attacks)\nWhen this Spirit is blocked, exhaust 1 opposing Spirit."
            },
            {
                level: [2], timing: 'permanent', keyword: 'increase windstorm', count: 1,
                description: "[LV2]\nIncrease the number of targets specified by the [Windstorm] of your Spirits by +1."
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'card-maparrot',
        name: 'Maparrot',
        quantity: 3,
        image: `${pathsSpirit}/Maparrot.webp`, // Path to the uploaded image
        cost: 3,
        symbol_cost: { "green": 1 },
        level: { 
            "level-1": { "core": 1, "bp": 1000 }, 
            "level-2": { "core": 2, "bp": 3000 },
            "level-3": { "core": 5, "bp": 5000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Song Bird"],
        effects: [
            {
                level: [1, 2, 3],
                timing: "whenSummoned",
                keyword: "place_core_on_target",
                quantity: 1,
                source: "void",
                target: {
                    scope: "player",
                    type: "spirit",
                    count: 1
                },
                description: "[LV1][LV2][LV3] (When Summoned)\nGain 1 core on target spirit you control."
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'card-providence-hououga',
        name: 'The Providence Hououga',
        quantity: 1,
        image: `${pathsSpirit}/The Providence Hououga.webp`, 
        cost: 10,
        symbol_cost: { "green": 6 },
        level: { 
            "level-1": { "core": 1, "bp": 6000 }, 
            "level-2": { "core": 4, "bp": 10000 },
            "level-3": { "core": 10, "bp": 16000 }  
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Winged Beast", "Vanity Deity"],
        effects: [
            {
                level: [1, 2, 3],
                timing: 'whenBlocked', 
                keyword: 'windstorm', 
                target: {
                    scope: 'opponent',
                    type: 'spirit',
                    count: 3,
                    isExhausted: false 
                },
                description: "[LV1][LV2][LV3] [Windstorm: 3] (When Attacks)\nWhen this Spirit is blocked, exhaust 1 opposing Spirit."
            },
            {
                level: [3],
                timing: "onLifeDamageDealt",
                keyword: "refresh_with_cost",
                cost: {
                    type: "core",
                    from: "reserve",
                    to: "void",
                    count: 1
                },
                description: "[LV3] (When Attacks)\nEach time this spirit deals any Damage to your opponent's Life, you may remove 1 core from your Reserve. In that case, refresh this spirit."
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
        id: 'card-amenborg',
        name: 'Amenborg',
        quantity: 3,
        image: `${pathsSpirit}/Amenborg.webp`, 
        cost: 2,
        symbol_cost: { "green": 1 },
        level: { 
            "level-1": { "core": 1, "bp": 2000 }, 
            "level-2": { "core": 3, "bp": 4000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Parasite"],
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
        quantity: 3,
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
                    count: 2,
                    isExhausted: false // เพิ่มเงื่อนไข: เลือกได้เฉพาะตัวที่ยังไม่เหนื่อย
                },
                description: "[LV1][LV2] [Windstorm: 2] (When Attacks)\nWhen this Spirit is blocked, exhaust 1 opposing Spirit."
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
            description: "[LV2] (When Attacks)\nWhen this Spirit's attack reduces the opposing Life, by sending a core from your Reserve to your Trash, return two opposing Spirits without [Tribute] to the Hand."
        }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'card-emperor-kaiseratlas',
        name: 'The Emperor Kaiseratlas',
        quantity: 3,
        image: `${pathsSpirit}/The Emperor Kaiseratlas.webp`, // สร้าง Path รูปภาพให้ถูกต้อง
        cost: 9,
        symbol_cost: { "green": 4 },
        level: { 
            "level-1": { "core": 1, "bp": 6000 }, 
            "level-2": { "core": 4, "bp": 9000 } 
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Mounted Warrior", "Shellman"],
        effects: [
            {
                level: [1, 2],
                timing: 'onSummon', // ทำงานตอนจะอัญเชิญ
                keyword: 'tribute',
                destination: 'void',
                condition: {
                    type: 'spirit',
                    costOrMore: 6 // Spirit ที่ใช้เป็น Tribute ต้องมี Cost 6 ขึ้นไป
                },
                description: "Tribute: Cost 6 or more -> Void\nAfter paying for the summoning cost, you must send all cores from one of your Cost 6 or more Spirits to the Void."
            },
            {
                level: [2],
                timing: 'onOpponentDestroyedInBattle', // ทำงานเมื่อชนะการต่อสู้
                keyword: 'deal_life_damage_with_cost',
                cost: {
                    type: 'core',
                    from: 'reserve',
                    to: 'void', // หรือ void ตามที่คุณต้องการ
                    count: 1
                },
                damage: 2,
                description: "[LV2] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, by sending a core from your Reserve to the Void, send two opposing Lives to their Reserve."
            }
        ],
        symbol: { "green": 2 },
    },
    {
        id: 'card-greatKing-blacktaurus',
        name: 'The GreatKing Blacktaurus',
        quantity: 10,
        image: `${pathsSpirit}/The GreatKing Blacktaurus.webp`, // สร้าง Path รูปภาพให้ถูกต้อง
        cost: 8,
        symbol_cost: { "green": 4 },
        level: { 
            "level-1": { "core": 1, "bp": 6000 }, 
            "level-2": { "core": 3, "bp": 9000 },
            "level-3": { "core": 7, "bp": 12000 }  
        },
        type: 'Spirit', 
        color: 'green',
        family: ["Shell Insect", "Blade Beast"],
        effects: [
            {
                level: [1, 2, 3],
                timing: 'onSummon', // ทำงานตอนจะอัญเชิญ
                keyword: 'tribute',
                destination: 'void',
                condition: {
                    type: 'spirit',
                    costOrMore: 3 // Spirit ที่ใช้เป็น Tribute ต้องมี Cost 6 ขึ้นไป
                },
                description: "Tribute: Cost 3 or more -> Void\nAfter paying for the summoning cost, you must send all cores from one of your Cost 3 or more Spirits to the Void."
            },
            {
                level: [1, 2, 3],
                timing: 'onOpponentDestroyedInBattle',
                keyword: 'deal_life_damage', 
                damage: 1,
                description: '[LV1][LV2][LV3] (When Attacks)\nWhen only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve.'
            },
            {
                level: [2, 3],
                timing: "onLifeDamageDealt",
                keyword: "refresh_with_cost",
                cost: {
                    type: "core",
                    from: "spiritThis",
                    to: "void",
                    count: 2
                },
                description: '[LV2][LV3] (When Attacks)\nWhen the opposing Life is reduced, by sending two cores from this Spirit to the Void, refresh this Spirit.'
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'nexus-fruit-of-wise-tree',
        name: 'The Fruit of Wise Tree',
        quantity: 3, // หรือตามจำนวนที่ต้องการ
        image: `${pathsNexus}/The Fruit of Wise Tree.webp`, // สร้าง Path รูปภาพให้ถูกต้อง
        cost: 4,
        symbol_cost: { "green": 2 },
        level: { 
            "level-1": { "core": 0 }, 
            "level-2": { "core": 3 } 
        },
        type: 'Nexus', 
        color: 'green',
        family: [], // Nexus ส่วนใหญ่ไม่มี Family
        effects: [
            {
                level: [1, 2],
                timing: 'onLifeReduced', // Timing ใหม่: เมื่อ Life ของเราลดลง
                keyword: 'gain_core_from_void',
                quantity: 1,
                description: "[LV1][LV2] (Permanent)\nEach time a spirit your opponent controls deals any Damage to your Life, gain 1 core in your Reserve."
            },
            {
                level: [2],
                timing: 'onEndStep', // Timing ใหม่: ทำงานตอนจบเทิร์น
                keyword: 'refresh_all_spirits',
                description: "[LV2] (Your End Phase)\nRefresh all exhausted spirits you control."
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'nexus-storm-highland',
        name: 'The Storm Highland',
        quantity: 3, // หรือตามจำนวนที่ต้องการ
        image: `${pathsNexus}/The Storm Highland.webp`, // สร้าง Path รูปภาพให้ถูกต้อง
        cost: 3,
        symbol_cost: { "green": 1 },
        level: { 
            "level-1": { "core": 0 }, 
            "level-2": { "core": 4 } 
        },
        type: 'Nexus', 
        color: 'green',
        family: [],
        effects: [
            {
                level: [1, 2],
                timing: 'onSpiritSummoned', // Timing ใหม่: ทำงานเมื่อมีการอัญเชิญ Spirit
                condition: {
                    hasKeyword: 'windstorm' // เงื่อนไข: Spirit ที่ถูกอัญเชิญต้องมี Windstorm
                },
                keyword: 'gain_core_by_windstorm_count',
                description: "[LV1][LV2] (During Your Main Phase)\nEach time you summon a spirit with Windstorm, gain cores on that spirit equal to the number specified by that spirit's Windstorm."
            },
            {
                level: [2],
                timing: 'onOpponentDestroyedByWindstormSpirit', // Timing ใหม่: ทำงานเมื่อ Spirit ที่มี Windstorm ของเราชนะการต่อสู้
                keyword: 'move_exhausted_to_deck_bottom',
                description: "[LV2] (Permanent)\nEach time a spirit you control with Windstorm defeats a spirit, move all spirits that were exhausted due to the effect of the winning spirit's Windstorm to the bottom of their owner's Deck."
            }
        ],
        symbol: { "green": 1 },
    },
    {
        id: 'magic-thorn-prison',
        name: 'Thorn Prison',
        quantity: 3, // หรือตามจำนวนที่ต้องการ
        image: `${pathsMagic}/Thorn Prison.webp`, // สร้าง Path รูปภาพให้ถูกต้อง
        cost: 4,
        symbol_cost: { "green": 2 },
        type: 'Magic', 
        color: 'green',
        effects: [
            {
                timing: 'flash',
                keyword: 'force_exhaust', // Keyword ใหม่สำหรับบังคับ exhaust
                target: {
                    scope: 'opponent', // เป้าหมายคือ Spirit ของ "คู่ต่อสู้"
                    type: 'spirit',
                    count: 2,
                    condition: {
                        isExhausted: false // ต้องเป็น Spirit ที่ยังไม่เหนื่อยเท่านั้น
                    }
                },
                description: "[Flash]\nThe opponent exhausts two Spirits they control."
            }
        ],
    },
    {
        id: 'magic-speed-star',
        name: 'Speed Star',
        quantity: 2, // หรือตามจำนวนที่ต้องการ
        image: `${pathsMagic}/Speed Star.webp`, // สร้าง Path รูปภาพให้ถูกต้อง
        cost: 5,
        symbol_cost: { "green": 3 },
        type: 'Magic', 
        color: 'green',
        effects: [
            {
                timing: "main",
                keyword: "core charge",
                buff_type: "gain_core_on_life_damage",
                quantity: 2,
                destination: "reserve",
                description: "[Main]\nDuring this turn, each time an attacking spirit you control deals any Damage to your opponent's Life, gain 2 cores in your Reserve."
            },
            {
                timing: 'flash', keyword: 'power up', power: 3000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +3000 BP.'
            }
        ],
    },
    {
        id: 'magic-full-add',
        name: 'Full Add',
        quantity: 1, // หรือตามจำนวนที่ต้องการ
        image: `${pathsMagic}/Full Add.webp`, // สร้าง Path รูปภาพให้ถูกต้อง
        cost: 5,
        symbol_cost: { "green": 3 },
        type: 'Magic', 
        color: 'green',
        effects: [
            {
                timing: "main",
                keyword: "cores_charge",
                target_level: 2,
                source: "void",
                target: {
                    scope: "player",
                    type: "nexus",
                    count: 1,
                    condition: {
                        max_level: 1
                    }
                },
                description: "[Main]\nGain enough cores on target nexus you control to make it LV2 (you cannot gain more than enough)."
            },
            {
                timing: 'flash', keyword: 'power up', power: 2000, duration: 'turn',
                target: { scope: 'any', type: 'spirit', count: 1 },
                description: '[Flash]\nDuring this turn, 1 Spirits gets +2000 BP.'
            }
        ],
    },
];