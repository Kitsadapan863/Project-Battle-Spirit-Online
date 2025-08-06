// js/ui/index.js
import { getDOMElements, createCardElement, createCoreElement } from './components.js';
import { updateAllModals } from './modals.js';

export function updateUI(gameState, myPlayerKey) {
    if (!gameState || !gameState.turn || !myPlayerKey) return;

    const dom = getDOMElements();
    const isMyTurn = gameState.turn === myPlayerKey;
    
    const opponentPlayerKey = (myPlayerKey === 'player1') ? 'player2' : 'player1';
    const myState = gameState[myPlayerKey];
    const opponentState = gameState[opponentPlayerKey];

    if (!myState || !opponentState) return;

    updateAllModals(gameState, myPlayerKey);

    // My Hand (Bottom)
    dom.playerHandContainer.innerHTML = '';
    myState.hand.forEach(card => dom.playerHandContainer.appendChild(createCardElement(card, 'hand', myPlayerKey, gameState, myPlayerKey)));

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
                coreContainer.appendChild(createCoreElement(core, { type: 'field', spiritUid: card.uid }, gameState, myPlayerKey));
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
        dom.playerReserveCoreContainer.appendChild(createCoreElement(core, locationInfo, gameState, myPlayerKey));
    });

    dom.opponentReserveCoreContainer.innerHTML = '';
    opponentState.reserve.forEach(core => {
        const locationInfo = { type: 'reserve' };
        dom.opponentReserveCoreContainer.appendChild(createCoreElement(core, locationInfo, gameState, myPlayerKey));
    });
    
    // Optional: Update Cost Trash (ทำเผื่อไว้เลย)
    dom.playerCostTrashZone.innerHTML = '<span>Cost Trash</span>'; // Reset title
    myState.costTrash.forEach(core => {
        const coreEl = createCoreElement(core, { type: 'trash' }, gameState, myPlayerKey);
        coreEl.setAttribute('draggable', 'false'); // Cores in trash can't be moved
        dom.playerCostTrashZone.appendChild(coreEl);
    });

    dom.opponentCostTrashZone.innerHTML = '<span>Cost Trash</span>'; // Reset title
    opponentState.costTrash.forEach(core => {
        const coreEl = createCoreElement(core, { type: 'trash' }, gameState, myPlayerKey);
        coreEl.setAttribute('draggable', 'false');
        dom.opponentCostTrashZone.appendChild(coreEl);
    });

    // Other zones...
    dom.playerLifeCirclesContainer.innerHTML = '';
    for (let i = 0; i < myState.life; i++) dom.playerLifeCirclesContainer.innerHTML += `<div class="life-circle"></div>`;
    dom.opponentLifeCirclesContainer.innerHTML = '';
    for (let i = 0; i < opponentState.life; i++) dom.opponentLifeCirclesContainer.innerHTML += `<div class="life-circle"></div>`;
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
}