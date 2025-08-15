// js/ui/index.js
import { getDOMElements, createCardElement, createCoreElement } from './components.js';
import { updateAllModals } from './modals.js';

export function updateUI(gameState, myPlayerKey, dom, callbacks, clientState) {
    if (!gameState || !gameState.turn || !myPlayerKey) return;

    
    const isMyTurn = gameState.turn === myPlayerKey;
    
    const opponentPlayerKey = (myPlayerKey === 'player1') ? 'player2' : 'player1';
    const myState = gameState[myPlayerKey];
    const opponentState = gameState[opponentPlayerKey];

    if (!myState || !opponentState) return;

    updateAllModals(gameState, myPlayerKey, callbacks);

    // My Hand (Bottom)
    dom.playerHandContainer.innerHTML = '';
    myState.hand.forEach(card => {
        // ไม่ต้องมีเงื่อนไขซับซ้อนที่นี่ ให้ createCardElement จัดการเอง
        const cardEl = createCardElement(card, 'hand', myPlayerKey, gameState, myPlayerKey, callbacks);
        dom.playerHandContainer.appendChild(cardEl);
    });
    // Opponent Hand (Top)
    dom.opponentHandContainer.innerHTML = '';
    opponentState.hand.forEach(() => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `<img src="./images/BS_back.webp" alt="Card Back"/>`;
        dom.opponentHandContainer.appendChild(cardEl);
    });

    // My Field (Bottom)
    dom.playerSpiritsContainer.innerHTML = '';
    dom.playerNexusesContainer.innerHTML = '';
    myState.field.forEach(card => {
        const cardEl = createCardElement(card, 'field', myPlayerKey, gameState, myPlayerKey);
        const coreContainer = cardEl.querySelector('.card-core-display');
        if (card.cores && coreContainer) {
            card.cores.forEach(core => {
                // ส่ง clientState ต่อไปให้ createCoreElement
                coreContainer.appendChild(createCoreElement(core, { type: 'field', spiritUid: card.uid }, gameState, myPlayerKey, clientState));
            });
        }
        if (card.type === 'Spirit') dom.playerSpiritsContainer.appendChild(cardEl);
        else dom.playerNexusesContainer.appendChild(cardEl);
    });
    
    // Opponent Field (Top)
    dom.opponentSpiritsContainer.innerHTML = '';
    dom.opponentNexusesContainer.innerHTML = '';
    opponentState.field.forEach(card => {
        const cardEl = createCardElement(card, 'field', opponentPlayerKey, gameState, myPlayerKey);
        const coreContainer = cardEl.querySelector('.card-core-display');
        if (card.cores && coreContainer) {
            card.cores.forEach(core => {
                coreContainer.appendChild(createCoreElement(core, { type: 'field', spiritUid: card.uid }, gameState, myPlayerKey));
            });
        }
        if (card.type === 'Spirit') dom.opponentSpiritsContainer.appendChild(cardEl);
        else dom.opponentNexusesContainer.appendChild(cardEl);
    });

    // Update Core Zones
    dom.playerReserveCoreContainer.innerHTML = '';
    myState.reserve.forEach(core => {
        const locationInfo = { type: 'reserve' };
        // ส่ง clientState ต่อไปให้ createCoreElement
        dom.playerReserveCoreContainer.appendChild(createCoreElement(core, locationInfo, gameState, myPlayerKey, clientState));
    });

    dom.opponentReserveCoreContainer.innerHTML = '';
    opponentState.reserve.forEach(core => {
        const locationInfo = { type: 'reserve' };
        dom.opponentReserveCoreContainer.appendChild(createCoreElement(core, locationInfo, gameState, myPlayerKey));
    });
    
    // Optional: Update Cost Trash (ทำเผื่อไว้เลย)
    dom.playerCostTrashZone.innerHTML = `<span>Cost Trash (${myState.costTrash.length})</span>`; // อัปเดต Title พร้อมจำนวนนับ
    const playerCostTrashCoreContainer = document.createElement('div');
    playerCostTrashCoreContainer.className = 'core-container';
    myState.costTrash.forEach(core => {
        const coreEl = createCoreElement(core, { type: 'trash' }, gameState, myPlayerKey, clientState);
        coreEl.setAttribute('draggable', 'false');
        playerCostTrashCoreContainer.appendChild(coreEl);
    });
    dom.playerCostTrashZone.appendChild(playerCostTrashCoreContainer);

    dom.opponentCostTrashZone.innerHTML = `<span>Cost Trash (${opponentState.costTrash.length})</span>`; // อัปเดต Title พร้อมจำนวนนับ
    const opponentCostTrashCoreContainer = document.createElement('div');
    opponentCostTrashCoreContainer.className = 'core-container';
    opponentState.costTrash.forEach(core => {
        const coreEl = createCoreElement(core, { type: 'trash' }, gameState, myPlayerKey, clientState);
        coreEl.setAttribute('draggable', 'false');
        opponentCostTrashCoreContainer.appendChild(coreEl);
    });
    dom.opponentCostTrashZone.appendChild(opponentCostTrashCoreContainer);

    

    // Other zones...
    dom.playerLifeCirclesContainer.innerHTML = '';
    for (let i = 0; i < myState.life; i++) dom.playerLifeCirclesContainer.innerHTML += `<div class="life-circle"></div>`;
    dom.opponentLifeCirclesContainer.innerHTML = '';
    for (let i = 0; i < opponentState.life; i++) dom.opponentLifeCirclesContainer.innerHTML += `<div class="life-circle"></div>`;

    // Update zone counts
    dom.playerReserveCoreContainer.parentElement.querySelector('span').textContent = `Your Reserve (${myState.reserve.length})`;
    dom.opponentReserveCoreContainer.parentElement.querySelector('span').textContent = `Opponent Reserve (${opponentState.reserve.length})`;

    dom.playerCostTrashZone.querySelector('span').textContent = `Cost Trash (${myState.costTrash.length})`;
    dom.opponentCostTrashZone.querySelector('span').textContent = `Cost Trash (${opponentState.costTrash.length})`;

    dom.playerCardTrashZone.querySelector('span').textContent = `Card Trash (${myState.cardTrash.length})`;
    dom.opponentCardTrashZone.querySelector('span').textContent = `Card Trash (${opponentState.cardTrash.length})`;
    

    dom.playerDeckElement.textContent = `Deck (${myState.deck.length})`;
    dom.opponentDeckElement.textContent = `Deck (${opponentState.deck.length})`;
    
    // Game Info
    dom.turnIndicator.textContent = isMyTurn ? "Your Turn" : "Opponent's Turn";
    dom.turnIndicator.style.color = isMyTurn ? '#00d2ff' : '#ff4141';
    dom.turnNumberElement.textContent = gameState.gameTurn;

    dom.phaseIndicator.querySelectorAll('.phase-step').forEach(p => p.classList.remove('active-phase'));
    const activePhaseEl = document.getElementById(`phase-${gameState.phase}`);
    if (activePhaseEl) activePhaseEl.classList.add('active-phase');
    
    const isActionable = isMyTurn && !gameState.summoningState.isSummoning && !gameState.placementState.isPlacing && !gameState.attackState.isAttacking && !gameState.flashState.isActive;
    dom.phaseBtn.disabled = !isActionable;
 
    // เพิ่มการ highlight เป้าหมาย
    if (clientState?.selectedCoreForMove) {
        dom.playerReserveCoreContainer.parentElement.classList.add('can-be-core-target');
        dom.playerSpiritsContainer.querySelectorAll('.card').forEach(c => c.classList.add('can-be-core-target'));
    } else {
        dom.playerReserveCoreContainer.parentElement.classList.remove('can-be-core-target');
        dom.playerSpiritsContainer.querySelectorAll('.card').forEach(c => c.classList.remove('can-be-core-target'));
    }

    // Update Card Trash Previews
    const playerTrashImageDiv = dom.playerCardTrashZone.querySelector('.latest-card-image');
    if (myState.cardTrash.length > 0) {
        const latestPlayerCard = myState.cardTrash[myState.cardTrash.length - 1];
        playerTrashImageDiv.style.backgroundImage = `url('${latestPlayerCard.image}')`;
    } else {
        playerTrashImageDiv.style.backgroundImage = 'none';
    }

    const opponentTrashImageDiv = dom.opponentCardTrashZone.querySelector('.latest-card-image');
    if (opponentState.cardTrash.length > 0) {
        const latestOpponentCard = opponentState.cardTrash[opponentState.cardTrash.length - 1];
        opponentTrashImageDiv.style.backgroundImage = `url('${latestOpponentCard.image}')`;
    } else {
        opponentTrashImageDiv.style.backgroundImage = 'none';
    }
}