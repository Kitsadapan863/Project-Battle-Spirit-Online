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

    // ตรวจสอบ Effect "force_max_level_on_crush"
    if (gameState?.turn === ownerKey && gameState.phase === 'attack') {
        const spiritHasCrush = spiritCard.effects?.some(e => e.keyword === 'crush');
        if (spiritHasCrush) {
            const forceMaxLevelNexus = gameState[ownerKey]?.field.find(card => 
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
        gameState[ownerKey]?.field.forEach(card => {
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