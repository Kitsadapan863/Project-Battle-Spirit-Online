// game_logic/state.js
const { playerCards } = require('./playerDeck.js');
const { opponentCards } = require('./opponentDeck.js');

let uniqueIdCounter = 0;

const createDeck = (cards) => JSON.parse(JSON.stringify(cards))
    .filter(Boolean)
    .map(c => ({ ...c, uid: `card-${uniqueIdCounter++}`, cores: [], isExhausted: false, tempBuffs: [] }))
    .sort(() => Math.random() - 0.5);

function createNewGame(player1Socket, player2Socket) {
    uniqueIdCounter = 0;
    const sessionId = `game-${Date.now()}`;
    const gameState = {
        sessionId: sessionId,
        gameMode: 'pvp',
        turn: 'player1',
        gameTurn: 1,
        gameover: false,
        phase: 'start',
        summoningState: { isSummoning: false, cardToSummon: null, costToPay: 0, selectedCores: [] },
        placementState: { isPlacing: false, targetSpiritUid: null },
        attackState: { isAttacking: false, attackerUid: null, defender: null, blockerUid: null, isClash: false },
        flashState: { isActive: false, timing: null, priority: null, hasPassed: {} },
        magicPaymentState: { isPaying: false, cardToUse: null, costToPay: 0, selectedCores: [], timing: null, effectToUse: null },
        discardState: { isDiscarding: false, count: 0, cardToDiscard: null },
        coreRemovalConfirmationState: { isConfirming: false, coreId: null, from: null, sourceUid: null, target: null },
        targetingState: { isTargeting: false, forEffect: null, onTarget: null },
        effectChoiceState: { isChoosing: false, card: null },
        deckDiscardViewerState: { isActive: false, cards: [], owner: null },
        player1: { id: player1Socket.id, life: 5, deck: createDeck(playerCards), hand: [], field: [], reserve: [], costTrash: [], cardTrash: [], tempBuffs: [] },
        player2: { id: player2Socket.id, life: 5, deck: createDeck(opponentCards), hand: [], field: [], reserve: [], costTrash: [], cardTrash: [], tempBuffs: [] },
    };

    for (let i = 0; i < 4; i++) {
        gameState.player1.hand.push(gameState.player1.deck.shift());
        gameState.player2.hand.push(gameState.player2.deck.shift());
        // gameState.player1.reserve.push({ id: `core-p1-init-${i}` });
        // gameState.player2.reserve.push({ id: `core-p2-init-${i}` });
    }
    for (let i = 0; i < 10; i++) {
        // gameState.player1.hand.push(gameState.player1.deck.shift());
        // gameState.player2.hand.push(gameState.player2.deck.shift());
        gameState.player1.reserve.push({ id: `core-p1-init-${i}` });
        gameState.player2.reserve.push({ id: `core-p2-init-${i}` });
    }
    
    return {
        sessionId: sessionId,
        player1: player1Socket,
        player2: player2Socket,
        gameState: gameState
    };
}

module.exports = { createNewGame };