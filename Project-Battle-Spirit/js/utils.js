// js/utils.js

/**
 * คำนวณเลเวลปัจจุบันของการ์ด (Spirit หรือ Nexus) จากจำนวนคอร์ที่วางอยู่
 */
export function getCardLevel(card) {
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
 * (เวอร์ชันอัปเดตให้ตรงกับ Server)
 */
export function getSpiritLevelAndBP(spiritCard, ownerKey, gameState) {
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
    
    // 3. ตรวจสอบบัฟชั่วคราวที่ติดอยู่กับ "ผู้เล่น" (Aura จาก Magic Card)
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