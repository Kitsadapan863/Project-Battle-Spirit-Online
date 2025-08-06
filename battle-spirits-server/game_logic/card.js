// game_logic/card.js
// เราจะลบ require('./gameLoop') จากข้างบนนี้

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

function destroyCard(gameState, cardUid, ownerKey) {
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
    console.log(`Destroyed: ${ownerKey}'s ${destroyedCard.name}`);
    return gameState;
}

function cleanupField(gameState) {
    const playerKeys = ['player1', 'player2'];
    playerKeys.forEach(playerKey => {
        if (gameState[playerKey] && gameState[playerKey].field) {
            for (let i = gameState[playerKey].field.length - 1; i >= 0; i--) {
                const card = gameState[playerKey].field[i];
                if (card.type === 'Spirit' && card.cores.length === 0) {
                    gameState = destroyCard(gameState, card.uid, playerKey);
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


module.exports = {
    drawCard,
    destroyCard,
    cleanupField,
    confirmDeckDiscard
    // เราจะเพิ่มฟังก์ชันอื่นๆ ที่นี่
};