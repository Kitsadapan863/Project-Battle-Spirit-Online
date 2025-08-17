// game_logic/card.js
// เราจะลบ require('./gameLoop') จากข้างบนนี้
const { getCardLevel } = require('./utils.js');
// เพิ่ม "reason" เข้าไปเป็น parameter ตัวสุดท้าย

function drawCard(gameState, playerKey) {
    // แล้วย้ายมา require ข้างในฟังก์ชันที่ใช้งานแทน
    const { checkGameOver } = require('./gameLoop');
    const player = gameState[playerKey];
    if (player.deck.length > 0) {
        player.hand.push(player.deck.shift());
    } else {
        player.life = 0;
        // ตอนนี้ checkGameOver จะถูกเรียกใช้หลังจากที่ gameLoop.js โหลดเสร็จแน่นอน
        gameState = checkGameOver(gameState);
    }
    return gameState;
}

function destroyCard(gameState, cardUid, ownerKey, reason = 'effect') {
    const owner = gameState[ownerKey];
    if (!owner) return { updatedGameState: gameState, wasSuccessful: false };

    const cardIndex = owner.field.findIndex(c => c.uid === cardUid);
    if (cardIndex === -1) return { updatedGameState: gameState, wasSuccessful: false };

    const [destroyedCard] = owner.field.splice(cardIndex, 1);
    if (destroyedCard.cores && destroyedCard.cores.length > 0) {
        owner.reserve.push(...destroyedCard.cores);
        destroyedCard.cores = [];
    }
    owner.cardTrash.push(destroyedCard);
    
    console.log(`[DESTROY LOG] ${ownerKey}'s ${destroyedCard.name} was removed. Reason: ${reason.toUpperCase()}`);
    
    return { updatedGameState: gameState, wasSuccessful: true }; // << แก้ไข return value
}


function cleanupField(gameState) {
    const playerKeys = ['player1', 'player2'];
    playerKeys.forEach(playerKey => {
        if (gameState[playerKey] && gameState[playerKey].field) {
            for (let i = gameState[playerKey].field.length - 1; i >= 0; i--) {
                const card = gameState[playerKey].field[i];
               // เงื่อนไขใหม่: ตรวจสอบ Level จริงๆ
                const { level } = getCardLevel(card); // Import getCardLevel มาจาก utils.js

                if (card.type === 'Spirit' && level < 1) {
                    // เรียกใช้ destroyCard พร้อมระบุ reason เป็น 'vanish'
                    gameState = destroyCard(gameState, card.uid, playerKey, 'vanish').updatedGameState;
                }
            }
        }
    });
    return gameState;
}

function confirmDeckDiscard(gameState) {
    const { isActive, cards, owner, context } = gameState.deckDiscardViewerState;
    if (!isActive) return gameState;

    gameState[owner].cardTrash.push(...cards);
    console.log(`Moved ${cards.length} discarded cards to ${owner}'s trash.`);

        if (context && context.sourceCardUid) {
        const ownerKey = owner === 'player1' ? 'player2' : 'player1'; // เจ้าของ Spirit ที่โจมตี
        const sourceCard = gameState[ownerKey].field.find(c => c.uid === context.sourceCardUid);

        if (sourceCard) {
            const destroyOnCrushEffect = sourceCard.effects.find(effect =>
                effect.keyword === 'destroy_on_crush' && effect.level.includes(context.sourceCardLevel)
            );

            if (destroyOnCrushEffect) {
                const hasDiscardedSpirit = context.discardedCards.some(c => c.type === 'Spirit');
                if (hasDiscardedSpirit) {
                    const opponentKey = owner;
                    const validTargets = gameState[opponentKey].field.filter(c => 
                        c.type === 'Spirit' && c.cost <= destroyOnCrushEffect.target.costOrLess
                    );

                    if (validTargets.length > 0) {
                        console.log(`[EFFECT LOG] BlastingGiant Douglas's effect triggers after discard confirmation!`);
                        gameState.targetingState = {
                            isTargeting: true,
                            forEffect: destroyOnCrushEffect,
                            cardSourceUid: sourceCard.uid,
                            targetPlayer: ownerKey,
                            selectedTargets: []
                        };
                    }
                }
            }
        }
    }

    gameState.deckDiscardViewerState = { isActive: false, cards: [], owner: null };
    
    // หลังจากปิดหน้าต่าง deck discard แล้ว, ถ้าอยู่ระหว่างการโจมตี, ให้เข้า flash timing
    if (gameState.attackState.isAttacking) {
        const { enterFlashTiming } = require('./battle.js');
        return enterFlashTiming(gameState, 'beforeBlock');
    }

    return gameState;
}

function selectCardForDiscard(gameState, playerKey, payload) {
    const { cardUid } = payload;
    const discardState = gameState.discardState;
    if (!discardState.isDiscarding || discardState.playerKey !== playerKey) {
        return gameState;
    }

    const player = gameState[playerKey];
    const cardToSelect = player.hand.find(c => c.uid === cardUid);
    if (!cardToSelect) return gameState;

    // เปลี่ยนจากเก็บใบเดียวเป็น Array
    if (!discardState.cardsToDiscard) {
        discardState.cardsToDiscard = [];
    }

    const selectedIndex = discardState.cardsToDiscard.findIndex(c => c.uid === cardUid);

    if (selectedIndex > -1) {
        // ถ้าคลิกใบเดิม ให้เอาออกจาก Array
        discardState.cardsToDiscard.splice(selectedIndex, 1);
    } else if (discardState.cardsToDiscard.length < discardState.count) {
        // ถ้ายังเลือกไม่ครบ ให้เพิ่มเข้าไปใน Array
        discardState.cardsToDiscard.push(cardToSelect);
    }
    
    return gameState;
}

function confirmDiscard(gameState, playerKey) {
    const discardState = gameState.discardState;
    if (!discardState.isDiscarding || discardState.playerKey !== playerKey || discardState.cardsToDiscard.length < discardState.count) {
        return gameState;
    }

    const player = gameState[playerKey];
    
    discardState.cardsToDiscard.forEach(cardToDiscard => {
        const cardIndex = player.hand.findIndex(c => c.uid === cardToDiscard.uid);
        if (cardIndex > -1) {
            const [discardedCard] = player.hand.splice(cardIndex, 1);
            player.cardTrash.push(discardedCard);
        }
    });

    // Reset discard state
    gameState.discardState = { isDiscarding: false, count: 0, cardsToDiscard: [], playerKey: null };
    
    return gameState;
}

function initiateDeckDiscard(gameState, targetPlayerKey, count) {
    const targetPlayer = gameState[targetPlayerKey];
    if (targetPlayer.deck.length === 0) return { discardedCards: [], updatedGameState: gameState };

    const actualCount = Math.min(count, targetPlayer.deck.length);
    const discardedCards = targetPlayer.deck.splice(0, actualCount);

    console.log(`[DECK DISCARD] Discarding ${actualCount} cards from ${targetPlayerKey}'s deck.`);

    // เข้าสู่สถานะให้ Client แสดง Modal
    gameState.deckDiscardViewerState = {
        isActive: true,
        cards: discardedCards,
        owner: targetPlayerKey
    };
    
    return { discardedCards, updatedGameState: gameState };
}

function applyPowerUpEffect(gameState, cardUid, power, duration) {
    const p1_key = 'player1';
    const p2_key = 'player2';

    let targetSpirit = gameState[p1_key].field.find(s => s.uid === cardUid);
    let ownerKey = p1_key;
    if (!targetSpirit) {
        targetSpirit = gameState[p2_key].field.find(s => s.uid === cardUid);
        ownerKey = p2_key;
    }
    
    if (targetSpirit) {
        if (!targetSpirit.tempBuffs) {
            targetSpirit.tempBuffs = [];
        }
        targetSpirit.tempBuffs.push({ type: 'BP', value: power, duration: duration });
        console.log(`[Effect: Power Up] ${targetSpirit.name} in ${ownerKey}'s field gets +${power} BP for the ${duration}.`);
    }
    return gameState;
}

function returnToHand(gameState, cardUid, ownerKey) {
    const owner = gameState[ownerKey];
    if (!owner) return { updatedGameState: gameState, wasSuccessful: false };

    const cardIndex = owner.field.findIndex(c => c.uid === cardUid);
    if (cardIndex === -1) return { updatedGameState: gameState, wasSuccessful: false };

    // นำการ์ดออกจากสนาม
    const [returnedCard] = owner.field.splice(cardIndex, 1);
    
    // ย้าย Core ทั้งหมดกลับไปที่ Reserve
    if (returnedCard.cores && returnedCard.cores.length > 0) {
        owner.reserve.push(...returnedCard.cores);
        returnedCard.cores = [];
    }

    // Reset สถานะของการ์ดก่อนนำขึ้นมือ
    returnedCard.isExhausted = false;
    returnedCard.tempBuffs = [];
    
    // นำการ์ดขึ้นมือ
    owner.hand.push(returnedCard);
    
    console.log(`[RETURN LOG] ${ownerKey}'s ${returnedCard.name} was returned to hand.`);
    
    return { updatedGameState: gameState, wasSuccessful: true };
}

module.exports = {
    drawCard,
    destroyCard,
    cleanupField,
    confirmDeckDiscard,
    selectCardForDiscard,
    confirmDiscard,
    initiateDeckDiscard,
    applyPowerUpEffect,
    returnToHand
    // เราจะเพิ่มฟังก์ชันอื่นๆ ที่นี่
};