// game_logic/state.js
const { playerCards } = require('./playerDeck.js');
const { opponentCards } = require('./opponentDeck.js');
const {redCards} = require('./redDeck.js')
const { greenCards } = require('./greenDeck.js');
const admin = require('firebase-admin');

// เชื่อมต่อ Firebase
if (!admin.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

let uniqueIdCounter = 0;

const createDeck = (cardTemplates) => {
    const deck = [];
    JSON.parse(JSON.stringify(cardTemplates)) // สร้าง deep copy เพื่อไม่ให้กระทบ template หลัก
        .filter(Boolean)
        .forEach(template => {
            const count = template.quantity || 1; // ถ้าไม่ได้ระบุ quantity ให้ถือว่าเป็น 1 ใบ
            for (let i = 0; i < count; i++) {
                // สร้างการ์ดแต่ละใบพร้อม UID ที่ไม่ซ้ำกัน
                deck.push({
                    ...template,
                    uid: `card-${uniqueIdCounter++}`,
                    cores: [],
                    isExhausted: false,
                    tempBuffs: []
                });
            }
        });
    
    // สับเด็ค
    return deck.sort(() => Math.random() - 0.5);
};

async function createNewGame(player1Socket, player2Socket) {
    // 1. ดึงข้อมูลการ์ดทั้งหมดจาก Firestore
    console.log("Fetching all cards from Firestore...");
    const cardsSnapshot = await db.collection('cards').get();
    const allCardsTemplate = cardsSnapshot.docs.map(doc => doc.data());
    
    // 2. (สมมติ) กำหนดเด็คเริ่มต้นให้ผู้เล่น (ในอนาคตจะมาจาก custom deck)
    const playerCards = allCardsTemplate.filter(c => c.color === 'blue');
    const redCards = allCardsTemplate.filter(c => c.color === 'red');
    


    uniqueIdCounter = 0;
    const sessionId = `game-${Date.now()}`;
    const gameState = {
        sessionId: sessionId,
        gameMode: 'pvp',
        turn: 'player1',
        gameTurn: 1,
        gameover: false,
        phase: 'start',
        summoningState: { isSummoning: false, cardToSummon: null, costToPay: 0, selectedCores: [], summonType: 'normal', summoningPlayer: null   },
        placementState: { isPlacing: false, targetSpiritUid: null, placingPlayer: null },
        attackState: { isAttacking: false, attackerUid: null, defender: null, blockerUid: null, isClash: false },
        flashState: { isActive: false, timing: null, priority: null, hasPassed: {} },
        magicPaymentState: { isPaying: false, cardToUse: null, costToPay: 0, selectedCores: [], timing: null, effectToUse: null },
        discardState: { isDiscarding: false, count: 0, cardToDiscard: null },
        coreRemovalConfirmationState: { isConfirming: false, coreId: null, from: null, sourceUid: null, target: null },
        targetingState: { isTargeting: false, forEffect: null, onTarget: null },
        effectChoiceState: { isChoosing: false, card: null },
        deckDiscardViewerState: { isActive: false, cards: [], owner: null },
        evolutionState: { isActive: false, spiritUid: null, selectedCores: [] },
        attackTargetingState: { isActive: false, attackerUid: null, validTargets: [] },
        attackChoiceState: { isActive: false, attackerUid: null },
        revealState: { isActive: false, card: null, condition: null, onReveal: null },
        assaultState: {
            canUse: false,      // กำลังจะใช้ Assault หรือไม่
            spiritUid: null,    // UID ของ Spirit ที่กำลังจะใช้
            usedCounts: {}      // เก็บจำนวนครั้งที่ใช้ไปแล้วของแต่ละ Spirit
        },
        effectResolutionState: { 
            isActive: false, 
            playerKey: null, 
            cardUid: null, 
            timing: null, 
            effectsToResolve: [], 
            resolvedEffects: [] 
        },
        effectCostConfirmationState: {
            isActive: false,
            playerKey: null,
            effect: null,
            cardSourceUid: null
        },
        tributeState: {
            isTributing: false,
            summoningPlayer: null,
            cardToSummon: null,
            selectedTributeUid: null
        },
        rpsState: {isActive: true, winner: null, player1: { choice: null }, player2: { choice: null }},
        player1: { id: player1Socket.id, life: 5, deck: createDeck(greenCards), hand: [], field: [], reserve: [], costTrash: [], cardTrash: [], tempBuffs: [] },
        player2: { id: player2Socket.id, life: 5, deck: createDeck(greenCards), hand: [], field: [], reserve: [], costTrash: [], cardTrash: [], tempBuffs: [] },
    };

    for (let i = 0; i < 10; i++) {
        gameState.player1.hand.push(gameState.player1.deck.shift());
        gameState.player2.hand.push(gameState.player2.deck.shift());
        // gameState.player1.reserve.push({ id: `core-p1-init-${i}` });
        // gameState.player2.reserve.push({ id: `core-p2-init-${i}` });
    }
    for (let i = 0; i < 20; i++) {
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