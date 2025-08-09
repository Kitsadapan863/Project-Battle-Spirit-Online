// game_logic/utils.js

/**
 * คำนวณเลเวลปัจจุบันของการ์ด (Spirit หรือ Nexus) จากจำนวนคอร์ที่วางอยู่
 */
function getCardLevel(card) {
    if (!card || !card.cores || !card.level) return { level: 0 };

    const currentCores = card.cores.length;
    let currentLevel = 0;
    
    const levels = Object.keys(card.level)
        .map(key => ({ name: key, ...card.level[key] }))
        .sort((a, b) => b.core - a.core);

    for (const levelInfo of levels) {
        if (currentCores >= levelInfo.core) {
            currentLevel = parseInt(levelInfo.name.replace('level-', ''), 10);
            break; 
        }
    }
    return { level: currentLevel };
}

/**
 * คำนวณเลเวลและ BP ของ Spirit โดยรวมบัฟชั่วคราวและเอฟเฟกต์จาก Nexus
 */
// --- นำโค้ดนี้ไปทับฟังก์ชันเดิมทั้งหมด ---
function getSpiritLevelAndBP(spiritCard, ownerKey, gameState) {
    if (!spiritCard || !spiritCard.cores || !spiritCard.level) return { level: 0, bp: 0, isBuffed: false };
    
    let { level } = getCardLevel(spiritCard);
    let currentBP = 0;
    let isBuffed = false;

    // ตรวจสอบ Effect "force_max_level_on_crush"
    if (gameState?.turn === ownerKey && gameState.phase === 'attack') {
        const spiritHasCrush = spiritCard.effects?.some(e => e.keyword === 'crush');
        if (spiritHasCrush) {
            const forceMaxLevelNexus = gameState[ownerKey].field.find(card => 
                card.type === 'Nexus' && card.effects?.some(eff => 
                    eff.keyword === 'force_max_level_on_crush' && eff.level.includes(getCardLevel(card).level)
                )
            );

            if (forceMaxLevelNexus) {
                const maxLevel = Math.max(...Object.keys(spiritCard.level).map(l => parseInt(l.replace('level-', ''), 10)));
                if (level !== maxLevel) {
                    level = maxLevel;
                    isBuffed = true;
                }
            }
        }
    }

    if (level > 0 && spiritCard.level[`level-${level}`]) {
        currentBP = spiritCard.level[`level-${level}`].bp || 0;
    }
    
    // ตรวจสอบ Nexus อื่นๆ ที่บวก BP ในช่วง Attack Step (ถ้ามี)
    if (gameState?.turn === ownerKey && gameState.phase === 'attack') {
        gameState[ownerKey].field.forEach(card => {
            if (card.type === 'Nexus' && card.effects) {
                const nexusLevel = getCardLevel(card).level;
                card.effects.forEach(eff => {
                    if (eff.timing === 'duringBattle' && eff.level.includes(nexusLevel) && eff.description.includes('+1000BP')) {
                         currentBP += 1000;
                         isBuffed = true;
                    }
                });
            }
        });
    }


    // ตรวจสอบ Nexus ที่บวก BP ในช่วง Attack Step (เช่น The Burning Canyon)
    if (gameState?.turn === ownerKey && gameState.phase === 'attack') {
        gameState[ownerKey].field.forEach(card => {
            if (card.type === 'Nexus' && card.effects) {
                const nexusLevel = getCardLevel(card).level;
                card.effects.forEach(eff => {
                    // เช็ค timing, level, และ keyword หรือ description ที่เกี่ยวข้อง
                    if (eff.timing === 'duringBattle' && eff.level.includes(nexusLevel) && eff.keyword === 'power up') {
                         currentBP += eff.power;
                         isBuffed = true;
                    }
                });
            }
        });
    }

    // ตรวจสอบเอฟเฟกต์เพิ่มพลังแบบต่อเนื่อง (Aura) จากการ์ดในสนาม
    if (gameState?.turn === ownerKey && gameState.phase === 'attack') {
        
        const effectiveKeywords = new Set(spiritCard.effects?.map(e => e.keyword) || []);

        // 1. ตรวจสอบ Aura ที่ "มอบ Keyword" ก่อน
        gameState[ownerKey].field.forEach(auraCard => {
            if (auraCard.effects) {
                const auraCardLevel = getCardLevel(auraCard).level;
                auraCard.effects.forEach(auraEffect => {
                    if (
                        (auraEffect.timing === 'yourAttackStep' || auraEffect.timing === 'duringBattle') &&
                        auraEffect.level.includes(auraCardLevel) &&
                        auraEffect.keyword === 'addEffects'
                    ) {
                        const condition = auraEffect.condition[0];
                        if (
                            spiritCard.effects?.some(e => e.keyword === condition) || // เช็ค Keyword
                            spiritCard.family?.includes(condition) // เช็ค Family
                        ) {
                            auraEffect.add_keyword.forEach(kw => effectiveKeywords.add(kw));
                        }
                    }
                });
            }
        });

        // 2. ตรวจสอบ Aura ที่ "เพิ่มพลังตาม Keyword"
        gameState[ownerKey].field.forEach(auraCard => {
            if (auraCard.effects) {
                const auraCardLevel = getCardLevel(auraCard).level;
                auraCard.effects.forEach(auraEffect => {
                    if (
                        (auraEffect.timing === 'yourAttackStep' || auraEffect.timing === 'duringBattle') &&
                        auraEffect.level.includes(auraCardLevel) &&
                        auraEffect.keyword === 'power up'
                    ) {
                        if (!auraEffect.condition) {
                            currentBP += auraEffect.power;
                            isBuffed = true;
                        } else if (auraEffect.condition.some(cond => effectiveKeywords.has(cond))) {
                            currentBP += auraEffect.power;
                            isBuffed = true;
                        }
                    }
                });
            }
        });
    }

    //ตรวจสอบบัฟ Aura ที่ติดตัวผู้เล่น ++
    if (gameState[ownerKey]?.tempBuffs.length > 0) {
        gameState[ownerKey].tempBuffs.forEach(buff => {
            if (buff.type === 'AURA_BP' && spiritCard.family?.includes(buff.targetFamily)) {
                currentBP += buff.power;
                isBuffed = true;
            }
        });
    }
    
    // ตรวจสอบบัฟชั่วคราว (tempBuffs)
    if (spiritCard.tempBuffs?.length > 0) {
        spiritCard.tempBuffs.forEach(buff => {
            if (buff.type === 'BP') {
                currentBP += buff.value;
                isBuffed = true;
            }
        });
    }
    
    return { level: level, bp: currentBP, isBuffed: isBuffed };
}
/**
 * คำนวณค่าร่ายสุทธิของ Spirit หรือ Magic หลังหักลดจากสัญลักษณ์บนสนาม
 */
function calculateCost(cardToSummon, playerType, gameState) {
    const player = gameState[playerType];
    let baseCost = cardToSummon.cost;

    // --- START: โค้ดที่เพิ่มเข้ามา ---
    // ตรวจสอบบัฟ Aura ที่เปลี่ยนแปลงค่าร่าย (เช่น Big Bang Energy)
    if (player.tempBuffs && player.tempBuffs.length > 0) {
        player.tempBuffs.forEach(buff => {
            if (buff.type === 'AURA_COST_CHANGE') {
                // เช็คว่าการ์ดใบนี้เข้าเงื่อนไขของบัฟหรือไม่ (Family)
                const targetFamily = buff.targetFamily[0];
                if (cardToSummon.family?.includes(targetFamily)) {
                    console.log(`[COST CALC] Big Bang Energy is active! Cost of ${cardToSummon.name} changed from ${baseCost} to ${buff.newValue}.`);
                    baseCost = buff.newValue; // เปลี่ยนค่าร่ายพื้นฐานทันที
                }
            }
        });
    }
    // --- END: โค้ดที่เพิ่มเข้ามา ---

    let totalReduction = 0;
    const fieldSymbols = { red: 0, purple: 0, green: 0, white: 0, blue: 0, yellow: 0 };

    player.field.forEach(card => {
        if (card.symbol) {
            for (const color in card.symbol) {
                if (fieldSymbols.hasOwnProperty(color)) {
                    fieldSymbols[color] += card.symbol[color];
                }
            }
        }
    });

    if (cardToSummon.symbol_cost) {
        let potentialReduction = 0;
        for (const color in cardToSummon.symbol_cost) {
            if (fieldSymbols.hasOwnProperty(color)) {
                potentialReduction += fieldSymbols[color];
            }
        }
        
        let maxReduction = 0;
        for (const color in cardToSummon.symbol_cost) {
            maxReduction += cardToSummon.symbol_cost[color];
        }
        
        totalReduction = Math.min(potentialReduction, maxReduction);
    }
    
    // ค่าร่ายสุดท้ายจะเป็น ค่าร่ายใหม่(จากบัฟ) - ค่าลดจากสัญลักษณ์
    return Math.max(0, baseCost - totalReduction);
}

/**
 * คำนวณจำนวนสัญลักษณ์ทั้งหมดบนการ์ดเพื่อใช้ในการคำนวณดาเมจ
 */
function calculateTotalSymbols(spiritCard) {
    if (!spiritCard || !spiritCard.symbol) return 1;
    let total = 0;
    for (const color in spiritCard.symbol) {
        total += spiritCard.symbol[color];
    }
    return total > 0 ? total : 1;
}

module.exports = {
    getCardLevel,
    getSpiritLevelAndBP,
    calculateCost,
    calculateTotalSymbols
};