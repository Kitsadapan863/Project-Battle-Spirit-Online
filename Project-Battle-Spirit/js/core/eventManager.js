// js/core/eventManager.js

export function setupInitialEventListeners(sendActionToServer) {
    const gameBoard = document.querySelector('.game-board');

    gameBoard.addEventListener('click', (event) => {
        const cardEl = event.target.closest('.card');
        const coreEl = event.target.closest('.core');

        // ตรวจสอบว่ามีการคลิกที่ Core หรือไม่
        if (coreEl && coreEl.classList.contains('selectable-for-payment')) {
            const spiritCardEl = coreEl.closest('.card');
            const reserveZoneEl = coreEl.closest('#player-reserve-zone');

            const payload = {
                coreId: coreEl.id,
                from: spiritCardEl ? 'card' : 'reserve',
                spiritUid: spiritCardEl ? spiritCardEl.id : null,
            };

            console.log('[CLIENT] Core selected for payment. Sending SELECT_CORE_FOR_PAYMENT...', payload);
            sendActionToServer({ type: 'SELECT_CORE_FOR_PAYMENT', payload: payload });
            return; // หยุดการทำงานทันทีเพื่อไม่ให้ไปเช็ค cardEl
        }
        
        if (cardEl) {
            const cardId = cardEl.id;
            console.log(`[CLIENT] Click detected on card: ${cardId}`);

            if (cardEl.closest('#player-hand')) {
                if (cardEl.classList.contains('can-summon')) {
                    console.log('%c[CLIENT] Card has .can-summon class. Sending INITIATE_SUMMON...', 'color: green;');
                    sendActionToServer({ type: 'INITIATE_SUMMON', payload: { cardUid: cardId } });
                } else {
                    console.error('[CLIENT] Card clicked in hand, but does not have .can-summon class.');
                }
            }
        }
    });
    
    document.getElementById('phase-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) {
            sendActionToServer({ type: 'ADVANCE_PHASE' });
        }
    });
    
    document.getElementById('confirm-summon-btn').addEventListener('click', (e) => {
        if (!e.target.disabled) {
            sendActionToServer({ type: 'CONFIRM_SUMMON' });
        }
    });
}