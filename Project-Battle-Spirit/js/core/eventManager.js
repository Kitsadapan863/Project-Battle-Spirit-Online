// ในไฟล์ Project-Battle-Spirit/js/core/eventManager.js
// import { getDOMElements, createCardElement, createCoreElement, formatCardEffects } from './components.js'; 
// // import { updateAllModals } from './modals.js';
// ประกาศ localGameState นอกฟังก์ชันเพื่อให้เข้าถึงได้
let localGameState = {};

export function updateLocalGameState(newState) {
    localGameState = newState;
}

export function setupInitialEventListeners(sendActionToServer, dom, callbacks) {
    const gameBoard = document.querySelector('.game-board');

    gameBoard.addEventListener('click', (event) => {
        const cardEl = event.target.closest('.card');
        const coreEl = event.target.closest('.core');

        if (coreEl) {
            // --- START: อัปเดต Logic การคลิก Core ---
            const isPaying = localGameState.summoningState?.isSummoning || localGameState.magicPaymentState?.isPaying;
            const isPlacing = localGameState.placementState?.isPlacing;

            if (isPaying && coreEl.classList.contains('selectable-for-payment')) {
                const spiritCardEl = coreEl.closest('.card');
                const payload = {
                    coreId: coreEl.id,
                    from: spiritCardEl ? 'card' : 'reserve',
                    spiritUid: spiritCardEl ? spiritCardEl.id : null,
                };
                sendActionToServer({ type: 'SELECT_CORE_FOR_PAYMENT', payload: payload });
                return;
            
            } else if (isPlacing && coreEl.classList.contains('selectable-for-placement')) {
                const fromCardEl = coreEl.closest('.card');
                const fromReserve = coreEl.closest('#player-reserve-zone');

                const payload = {
                    coreId: coreEl.id,
                    from: fromCardEl ? 'card' : 'reserve',
                    sourceCardUid: fromCardEl ? fromCardEl.id : null,
                    targetCardUid: localGameState.placementState.targetSpiritUid
                };
                
                console.log('[CLIENT] Core selected for placement. Sending MOVE_CORE...', payload);
                // Server ของคุณมี Action 'MOVE_CORE' รอรับอยู่แล้ว
                sendActionToServer({ type: 'MOVE_CORE', payload: payload });
                return;
            }
            // --- END: อัปเดต Logic การคลิก Core ---
        }
        
        if (cardEl) {
            const cardId = cardEl.id;
            if (cardEl.closest('#player-hand')) {
                // Logic สำหรับการ์ดบนมือ
                if (cardEl.classList.contains('can-summon')) {
                    sendActionToServer({ type: 'INITIATE_SUMMON', payload: { cardUid: cardId } });
                }
            } else if (cardEl.closest('#player-field')) {
                // Logic สำหรับการ์ดบนสนาม
                if (cardEl.classList.contains('can-attack')) {
                    console.log(`[CLIENT] Attacking with ${cardId}. Sending DECLARE_ATTACK...`);
                    sendActionToServer({ type: 'DECLARE_ATTACK', payload: { attackerUid: cardId } });
                }else if (cardEl.classList.contains('can-block')) {
                    console.log(`[CLIENT] Blocking with ${cardId}. Sending DECLARE_BLOCK...`);
                    sendActionToServer({ type: 'DECLARE_BLOCK', payload: { blockerUid: cardId } });
                }
   
            }
        }
    });

    gameBoard.addEventListener('mouseover', (event) => {
        const cardEl = event.target.closest('.card');
        if (!cardEl) return;

        // หาข้อมูลการ์ดจาก localGameState
        const cardId = cardEl.id;
        let cardData = null;

        // ค้นหาใน hand และ field ของผู้เล่นทุกคน
        ['player1', 'player2'].forEach(playerKey => {
            if (localGameState[playerKey]) {
                const foundInHand = localGameState[playerKey].hand.find(c => c.uid === cardId);
                const foundInField = localGameState[playerKey].field.find(c => c.uid === cardId);
                if (foundInHand) cardData = foundInHand;
                if (foundInField) cardData = foundInField;
            }
        });

        if (cardData) {
            dom.detailCardImage.src = cardData.image;
            // ใช้ฟังก์ชัน formatEffectText จาก callbacks ที่ส่งเข้ามา
            dom.detailCardEffects.innerHTML = callbacks.formatEffectText(cardData);
            dom.cardDetailViewer.classList.add('visible');
        }
    });

    gameBoard.addEventListener('mouseout', (event) => {
        const cardEl = event.target.closest('.card');
        if (cardEl) {
            dom.cardDetailViewer.classList.remove('visible');
        }
    });
    
    document.getElementById('phase-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) sendActionToServer({ type: 'ADVANCE_PHASE' });
    });
    
    document.getElementById('confirm-summon-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) sendActionToServer({ type: 'CONFIRM_SUMMON' });
    });

    document.getElementById('cancel-summon-btn').addEventListener('click', () => {
        sendActionToServer({ type: 'CANCEL_SUMMON' });
    });

    // --- START: เพิ่ม Event Listener สำหรับปุ่ม Placement ---
    document.getElementById('confirm-placement-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) {
            console.log('[CLIENT] Confirm Placement clicked. Sending CONFIRM_PLACEMENT...');
            sendActionToServer({ type: 'CONFIRM_PLACEMENT' });
        }
    });
    // --- END: เพิ่ม Event Listener สำหรับปุ่ม Placement ---

    document.getElementById('pass-flash-btn').addEventListener('click', () => {
        console.log('[CLIENT] Pass Flash clicked. Sending PASS_FLASH...');
        sendActionToServer({ type: 'PASS_FLASH' });
    });

    //เพิ่ม Event Listener สำหรับปุ่มรับ Damage 
    document.getElementById('take-damage-btn').addEventListener('click', () => {
        console.log('[CLIENT] Take Life Damage clicked. Sending TAKE_LIFE_DAMAGE...');
        sendActionToServer({ type: 'TAKE_LIFE_DAMAGE' });
    });
}