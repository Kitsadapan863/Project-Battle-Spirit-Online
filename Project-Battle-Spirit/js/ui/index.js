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



    // Function to render a core zone (Reserve, Cost Trash)

    const renderCoreZone = (zoneElement, cores, zoneName, ownerState, isPlayer) => {

        const coreContainer = zoneElement.querySelector('.core-container') || document.createElement('div');

        if (!coreContainer.classList.contains('core-container')) {

            coreContainer.className = 'core-container';

        }

       

        coreContainer.innerHTML = ''; // Clear only the cores

        cores.forEach(core => {

            const locationInfo = { type: zoneName.toLowerCase().replace(' ', '-') };

            const coreEl = createCoreElement(core, locationInfo, gameState, myPlayerKey, isPlayer ? clientState : undefined);

            if (zoneName === 'Cost Trash') {

                coreEl.setAttribute('draggable', 'false');

            }

            coreContainer.appendChild(coreEl);

        });



        // Ensure container is in the DOM

        if (!zoneElement.contains(coreContainer)) {

            zoneElement.appendChild(coreContainer);

        }



        // Update title and count

        const span = zoneElement.querySelector('span');

        span.textContent = `${zoneName} (${cores.length})`;

    };



    // Update Player's Core Zones

    renderCoreZone(dom.playerReserveCoreContainer.parentElement, myState.reserve, 'Your Reserve', myState, true);

    renderCoreZone(dom.playerCostTrashZone, myState.costTrash, 'Cost Trash', myState, true);



    // Update Opponent's Core Zones

    renderCoreZone(dom.opponentReserveCoreContainer.parentElement, opponentState.reserve, 'Opponent Reserve', opponentState, false);

    renderCoreZone(dom.opponentCostTrashZone, opponentState.costTrash, 'Cost Trash', opponentState, false);

    // --- END: MODIFIED SECTION ---

   



    // Other zones...

    dom.playerLifeCirclesContainer.innerHTML = '';

    for (let i = 0; i < myState.life; i++) dom.playerLifeCirclesContainer.innerHTML += `<div class="life-circle"></div>`;

    dom.opponentLifeCirclesContainer.innerHTML = '';

    for (let i = 0; i < opponentState.life; i++) dom.opponentLifeCirclesContainer.innerHTML += `<div class="life-circle"></div>`;



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