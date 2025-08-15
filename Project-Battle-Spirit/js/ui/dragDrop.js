// js/ui/dragDrop.js
import { getDOMElements } from './components.js';

// หมายเหตุ: ในเวอร์ชันออนไลน์ การลากและวางจะซับซ้อนขึ้น
// โค้ดส่วนนี้จะยังไม่ทำงาน 100% จนกว่าจะมีการส่ง action ไปให้ server
// แต่การสร้างไฟล์นี้จะช่วยแก้ปัญหา 404 Not Found ครับ

function handleDrop(e, gameState, callbacks) {
    e.preventDefault();
    // Drop logic will be handled by sending actions to the server
}

export function attachDragAndDropListeners(gameState, myPlayerKey) {
    const isMyTurn = gameState.turn === myPlayerKey;
    if (!isMyTurn || gameState.phase !== 'main' || gameState.summoningState.isSummoning || gameState.placementState.isPlacing) {
        return;
    }

    document.querySelectorAll('.core[draggable="true"]').forEach(core => {
        if (core.dataset.dragListenerAttached === 'true') return;
        core.dataset.dragListenerAttached = 'true';

        core.addEventListener('dragstart', e => {
            e.stopPropagation();
            const parentCardEl = e.target.closest('.card');
            const from = parentCardEl ? 'field' : 'reserve';
            
            e.dataTransfer.setData('type', 'core');
            e.dataTransfer.setData('id', core.id);
            if (parentCardEl) {
                e.dataTransfer.setData('from', 'card');
                e.dataTransfer.setData('cardUid', parentCardEl.id);
            } else {
                e.dataTransfer.setData('from', 'reserve');
            }
        });
    });
    
    const { playerReserveCoreContainer } = getDOMElements();
    const dropZones = [playerReserveCoreContainer.parentElement, ...document.querySelectorAll('#player-field .card')];
    
    dropZones.forEach(zone => {
        if (zone.dataset.dropListenerAttached === 'true') return;
        zone.dataset.dropListenerAttached = 'true';

        zone.addEventListener('dragover', e => {
            e.preventDefault();
        });
        zone.addEventListener('drop', (e) => handleDrop(e));
    });
}