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
function getSpiritLevelAndBP(spiritCard, ownerKey, gameState) {
    if (!spiritCard || !spiritCard.cores || !spiritCard.level) return { level: 0, bp: 0, isBuffed: false };
    
    let { level } = getCardLevel(spiritCard);
    let currentBP = 0;
    let isBuffed = false;

    // 1. ตรวจสอบ Effect "force_max_level_on_crush" (ยังคงเหมือนเดิม)
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

    // 2. หา BP พื้นฐานตามเลเวล
    if (level > 0 && spiritCard.level[`level-${level}`]) {
        currentBP = spiritCard.level[`level-${level}`].bp || 0;
    }
    
   if (gameState.phase === 'attack' && gameState.turn === ownerKey) {
        const effectiveKeywords = new Set(spiritCard.effects?.map(e => e.keyword) || []);
        
        // วนลูปการ์ดทุกใบบนสนามเพื่อหา Aura ที่ส่งผลต่อ Spirit ใบนี้
        gameState[ownerKey].field.forEach(auraCard => {
            if (!auraCard.effects) return;
            const auraCardLevel = getCardLevel(auraCard).level;
            
            auraCard.effects.forEach(effect => {
                // เช็ค Timing, Level, และ Keyword ของเอฟเฟกต์
                if ((effect.timing === 'yourAttackStep' || effect.timing === 'duringBattle') && 
                    effect.level.includes(auraCardLevel) && 
                    effect.keyword === 'power up') {
                    
                    // กรณีบัฟไม่มีเงื่อนไข (เช่น The Burning Canyon)
                    if (!effect.condition) {
                        currentBP += effect.power;
                        isBuffed = true;
                    } 
                    // กรณีบัฟมีเงื่อนไข (เช่น Sabecaulus)
                    else if (effect.condition.some(cond => effectiveKeywords.has(cond))) {
                        currentBP += effect.power;
                        isBuffed = true;
                    }
                }
            });
        });
    }
    
    // 3. ตรวจสอบบัฟชั่วคราวที่ติดอยู่กับ "ผู้เล่น" (Aura จาก Magic Card)
    if (gameState[ownerKey]?.tempBuffs?.length > 0) {
        gameState[ownerKey].tempBuffs.forEach(buff => {
            // บัฟ Aura BP ทั่วไป (เช่นจาก Ovirapt)
            if (buff.type === 'AURA_BP' && spiritCard.family?.includes(buff.targetFamily)) {
                currentBP += buff.power;
                isBuffed = true;
            }

            // *** นี่คือโค้ดที่ถูกต้องสำหรับ Lightning Aura ***
            // จะคำนวณ BP ก็ต่อเมื่อเป็น Spirit ที่กำลังโจมตีอยู่เท่านั้น
            if (buff.type === 'AURA_CONDITIONAL_BP' && gameState.phase === 'attack' && spiritCard.uid === gameState.attackState?.attackerUid) {
                const effectiveKeywords = new Set(spiritCard.effects?.map(e => e.keyword) || []);
                
                buff.buffs.forEach(b => {
                    let powerToAdd = 0;
                    if (b.condition.hasKeyword && effectiveKeywords.has(b.condition.hasKeyword)) {
                        powerToAdd = b.power;
                    } else if (b.condition.hasNotKeyword && !effectiveKeywords.has(b.condition.hasNotKeyword)) {
                        powerToAdd = b.power;
                    }

                    if (powerToAdd > 0) {
                        currentBP += powerToAdd;
                        isBuffed = true;
                    }
                });
            }
        });
    }

    // 4. ตรวจสอบบัฟชั่วคราวที่ติดอยู่กับ "Spirit" โดยตรง
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

/**
 * [อัปเกรด] ตรวจสอบว่า targetCard มี Armor/Immunity ป้องกัน sourceCard หรือไม่
 * @param {object} targetCard - การ์ดเป้าหมาย
 * @param {object} sourceCard - การ์ดต้นกำเนิดเอฟเฟกต์
 * @param {string} targetOwnerKey - "player1" หรือ "player2" ของเจ้าของการ์ดเป้าหมาย
 * @param {object} gameState - สถานะเกม
 * @returns {boolean}
 */
function isImmune(targetCard, sourceCard, targetOwnerKey, gameState) {
    if (!targetCard || !sourceCard || !targetOwnerKey) {
        return false;
    }

    const sourceColor = sourceCard.color;
    
    // --- 1. ตรวจสอบเกราะ/Immunity ที่ติดตัวเป้าหมายเอง ---
    if (targetCard.effects) {
        const { level } = getCardLevel(targetCard);
        const selfImmunity = targetCard.effects.find(
            (effect) => (effect.keyword === 'armor' || effect.keyword === 'immunity') && effect.level.includes(level)
        );

        if (selfImmunity) {
                let immunityColors = selfImmunity.colors;

                // ถ้าเป็น Immunity: ∞ ให้คำนวณสีจากสนามคู่ต่อสู้
                if (immunityColors === 'opponent_symbols') {
                    const opponentKey = targetOwnerKey === 'player1' ? 'player2' : 'player1';
                    const opponentSymbols = new Set(); // ใช้ Set เพื่อป้องกันสีซ้ำ
                    gameState[opponentKey].field.forEach(card => {
                        if (card.symbol) {
                            Object.keys(card.symbol).forEach(color => opponentSymbols.add(color));
                        }
                    });
                    immunityColors = Array.from(opponentSymbols);
                    console.log(`[IMMUNITY ∞] ${targetCard.name} is currently immune to colors: [${immunityColors.join(', ')}]`);
                }

                if (Array.isArray(immunityColors) && immunityColors.includes(sourceCard.color)) {
                    console.log(`[IMMUNITY] ${targetCard.name} is immune to ${sourceCard.color} effects.`);
                    return true;
                }
            }
    }

    // --- 2. ตรวจสอบ Aura ที่ให้เกราะ/Immunity จากการ์ดใบอื่นในสนาม ---
    const ownerField = gameState[targetOwnerKey].field;
    for (const auraCard of ownerField) {
        if (!auraCard.effects || auraCard.uid === targetCard.uid) continue; // ข้ามตัวเอง

        const { level: auraLevel } = getCardLevel(auraCard);
        const auraEffect = auraCard.effects.find(
            (effect) => effect.keyword === 'aura_grant_immunity' && effect.level.includes(auraLevel)
        );

        if (auraEffect) {
            // ตรวจสอบว่า targetCard เข้าเงื่อนไขของ Aura หรือไม่ (เช่น เป็น Spirit สีขาว)
            const filter = auraEffect.target_filter;
            const targetMatchesFilter = 
                (filter.color ? targetCard.color === filter.color : true) &&
                (filter.type ? targetCard.type === filter.type : true);

            // ถ้าเข้าเงื่อนไข และ Aura ป้องกันสีของ sourceCard ได้
            if (targetMatchesFilter && auraEffect.colors.includes(sourceColor)) {
                console.log(`[IMMUNITY] ${targetCard.name} is immune to ${sourceColor} effects from an aura by ${auraCard.name}.`);
                return true;
            }
        }
    }

    return false;
}

module.exports = {
    getCardLevel,
    getSpiritLevelAndBP,
    calculateCost,
    calculateTotalSymbols,
    isImmune
};