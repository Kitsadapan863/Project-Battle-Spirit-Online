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

function destroyCard(gameState, cardUid, ownerKey, reason = 'effect') { // กำหนด 'effect' เป็นค่า default
    const owner = gameState[ownerKey];
    if (!owner) return gameState;

    const cardIndex = owner.field.findIndex(c => c.uid === cardUid);
    if (cardIndex === -1) return gameState;

    const [destroyedCard] = owner.field.splice(cardIndex, 1);
    if (destroyedCard.cores && destroyedCard.cores.length > 0) {
        owner.reserve.push(...destroyedCard.cores);
        destroyedCard.cores = [];
    }
    owner.cardTrash.push(destroyedCard);

    // --- START: เพิ่มโค้ดส่วนนี้ ---
    // Log เหตุผลของการทำลายเพื่อช่วยในการ Debug
    console.log(`[DESTROY LOG] ${ownerKey}'s ${destroyedCard.name} was removed from the field. Reason: ${reason.toUpperCase()}`);

    // *** จุดสำคัญสำหรับอนาคต ***
    // นี่คือจุดที่คุณจะสามารถเพิ่ม Logic สำหรับ Triggered Effects ได้
    if (reason === 'battle' || reason === 'effect') {
        // gameState = resolveTriggeredEffects(gameState, destroyedCard, 'whenDestroyed', ownerKey);
    }
    // --- END: เพิ่มโค้ดส่วนนี้ ---

    return gameState;
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
                    gameState = destroyCard(gameState, card.uid, playerKey, 'vanish');
                }
            }
        }
    });
    return gameState;
}

function confirmDeckDiscard(gameState) {
    const { isActive, cards, owner } = gameState.deckDiscardViewerState;
    if (!isActive) return gameState;

    gameState[owner].cardTrash.push(...cards);
    console.log(`Moved ${cards.length} discarded cards to ${owner}'s trash.`);

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

module.exports = {
    drawCard,
    destroyCard,
    cleanupField,
    confirmDeckDiscard,
    selectCardForDiscard,
    confirmDiscard,
    initiateDeckDiscard
    // เราจะเพิ่มฟังก์ชันอื่นๆ ที่นี่
};