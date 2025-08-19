import { getSpiritLevelAndBP, isImmune  } from "../utils.js";
import { createCardElement } from "./components.js";

export function updateAllModals(gameState, myPlayerKey, callbacks) {
    const modals = {
        summonPaymentOverlay: document.getElementById('summon-payment-overlay'),
        magicPaymentOverlay: document.getElementById('magic-payment-overlay'),
        placementOverlay: document.getElementById('placement-overlay'),
        defenseOverlay: document.getElementById('defense-overlay'),
        flashOverlay: document.getElementById('flash-overlay'),
        discardOverlay: document.getElementById('discard-overlay'),
        coreRemovalConfirmationOverlay: document.getElementById('core-removal-confirmation-overlay'),
        targetingOverlay: document.getElementById('targeting-overlay'),
        effectChoiceModal: document.getElementById('effect-choice-modal'),
        gameOverModal: document.getElementById('game-over-modal'),
        rpsModal: document.getElementById('rps-modal'), // << เพิ่ม
        deckDiscardViewerModal: document.getElementById('deck-discard-viewer-modal'),
        evolutionModal: document.getElementById('evolution-modal'),
        attackChoiceModal: document.getElementById('attack-choice-modal'),
        assaultModal: document.getElementById('assault-modal'),
        effectResolutionModal: document.getElementById('effect-resolution-modal'), 
        effectCostConfirmationModal: document.getElementById('effect-cost-confirmation-modal'),
        tributeSelectionModal: document.getElementById('tribute-selection-modal'), 
        revealModal: document.getElementById('reveal-modal'),    

    };

    

    // --- 1. ซ่อน Modal ที่เป็น Action หลักทั้งหมดก่อน ---
    Object.values(modals).forEach(modal => {
        if (modal && modal.id !== 'game-over-modal') {
             modal.classList.remove('visible');
        }
    });

    // --- 2. ตรวจสอบและแสดง Modal ที่ถูกต้องเพียงอันเดียว (จัดลำดับความสำคัญ) ---
    const {
        effectChoiceState,
        discardState,
        flashState,
        attackState,
        placementState,
        magicPaymentState,
        summoningState,
        coreRemovalConfirmationState,
        targetingState,
        deckDiscardViewerState,
        rpsState,
        evolutionState,
        attackChoiceState,
        assaultState,
        effectResolutionState,
        revealState,
        effectCostConfirmationState,
        tributeState 
    } = gameState;

    // --- เริ่มต้น if/else if chain ที่นี่ ---
    if (rpsState.isActive) {
        modals.rpsModal.classList.add('visible');
        const myChoice = rpsState[myPlayerKey].choice;
        const opponentKey = myPlayerKey === 'player1' ? 'player2' : 'player1';
        const opponentChoice = rpsState[opponentKey].choice;
        const resultText = document.getElementById('rps-result');
        
        // อัปเดต UI ปุ่มที่เลือก
        document.querySelectorAll('.rps-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.choice === myChoice) {
                btn.classList.add('selected');
            }
            // ทำให้กดไม่ได้ถ้าเลือกไปแล้ว
            btn.disabled = !!myChoice;
        });


        if (myChoice && !opponentChoice) {
            resultText.textContent = 'Waiting for opponent...';
        } else if (!myChoice && opponentChoice) {
            resultText.textContent = 'Opponent has chosen. Your turn!';
        } else if (!myChoice && !opponentChoice) {
            resultText.textContent = '';
        }
     

    }else if (tributeState.isTributing && tributeState.summoningPlayer === myPlayerKey) {
        modals.tributeSelectionModal.classList.add('visible');
        document.getElementById('confirm-tribute-btn').disabled = !tributeState.selectedTributeUid;
    }
    else if (effectCostConfirmationState.isActive && effectCostConfirmationState.playerKey === myPlayerKey) { // <-- เพิ่ม else if นี้ (สำคัญมาก ต้องอยู่ลำดับต้นๆ)
        modals.effectCostConfirmationModal.classList.add('visible');
        const effect = effectCostConfirmationState.effect;
        const card = gameState[myPlayerKey].field.find(c => c.uid === effectCostConfirmationState.cardSourceUid);
        if (card && effect) {
            document.getElementById('effect-cost-title').textContent = `Activate ${card.name}'s Effect?`;
            const effectDesc = effect.description.replace(/\n/g, ' '); // ทำให้เป็นบรรทัดเดียว
            document.getElementById('effect-cost-prompt').textContent = `Pay ${effect.cost.count} core from your Reserve to activate: "${effectDesc}"`;
        }
    }
    else if (effectResolutionState.isActive && effectResolutionState.playerKey === myPlayerKey) {
        modals.effectResolutionModal.classList.add('visible');
        const card = gameState[myPlayerKey].field.find(c => c.uid === effectResolutionState.cardUid);
        
        if (card) {
            document.getElementById('effect-resolution-title').textContent = `Effects for ${card.name}`;
        }

        const buttonsContainer = document.getElementById('effect-resolution-buttons');
        buttonsContainer.innerHTML = ''; // เคลียร์ปุ่มเก่า
        effectResolutionState.effectsToResolve.forEach(effect => {
            const button = document.createElement('button');
            // นำบรรทัดแรกของ description มาเป็นข้อความบนปุ่ม
            const buttonText = effect.keyword
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            button.textContent = buttonText;
            button.dataset.effectId = effect.uniqueId;
            button.className = 'effect-choice-btn'; // เพิ่ม class ไว้ตกแต่ง
            buttonsContainer.appendChild(button);
        });
    } 
    
    // ให้ Assault มีความสำคัญสูงกว่าหน้าต่างอื่นๆ ตอนโจมตี
    else if (assaultState.canUse && gameState.turn === myPlayerKey) {
        modals.assaultModal.classList.add('visible');
        const spirit = gameState[myPlayerKey].field.find(s => s.uid === assaultState.spiritUid);
        if (spirit) {
            document.getElementById('assault-title').textContent = `Assault: ${spirit.name}`;
        }
        
        // แสดง Nexus ที่ยังไม่ Exhausted ให้เลือก
        const nexusContainer = document.getElementById('assault-nexus-container');
        nexusContainer.innerHTML = '';
        const validNexuses = gameState[myPlayerKey].field.filter(c => c.type === 'Nexus' && !c.isExhausted);
        
        validNexuses.forEach(nexus => {
            const nexusEl = createCardElement(nexus, 'field', myPlayerKey, gameState, myPlayerKey);
            nexusEl.classList.add('can-be-assault-nexus'); // เพิ่ม class ให้มีแสง
            nexusContainer.appendChild(nexusEl);
        });
    }
    
    else if (revealState?.isActive && gameState.turn === myPlayerKey) {
        modals.revealModal.classList.add('visible');
        const container = document.getElementById('reveal-card-container');
        container.innerHTML = '';
        if(revealState.card) {
            const cardEl = createCardElement(revealState.card, 'viewer', myPlayerKey, gameState, myPlayerKey, callbacks);
            container.appendChild(cardEl);
        }
    }
    else if (attackChoiceState?.isActive && gameState.turn === myPlayerKey) {
        modals.attackChoiceModal.classList.add('visible');
    }
    else if (evolutionState.isActive && gameState.flashState.priority === myPlayerKey) {
        modals.evolutionModal.classList.add('visible');
        const spirit = gameState[myPlayerKey].field.find(s => s.uid === evolutionState.spiritUid);
        if (spirit) {
            document.getElementById('evolution-title').textContent = `Evolution: ${spirit.name}`;
        }
        document.getElementById('evolution-selected-value').textContent = evolutionState.selectedCores.length;
    }
    // ลำดับ 1 (สำคัญที่สุด): Deck Discard Viewer
    else if (deckDiscardViewerState.isActive) {
        modals.deckDiscardViewerModal.classList.add('visible');
        const container = document.getElementById('deck-discard-viewer-container');
        container.innerHTML = '';
        deckDiscardViewerState.cards.forEach(card => {
            const cardEl = createCardElement(card, 'viewer', deckDiscardViewerState.owner, gameState, myPlayerKey, callbacks);
            container.appendChild(cardEl);
        });
    }
    // ลำดับ 2: Modal ที่ต้องการการตัดสินใจเฉพาะหน้า
    else if (targetingState.isTargeting && targetingState.targetPlayer === myPlayerKey) {
        modals.targetingOverlay.classList.add('visible');
        const effect = targetingState.forEffect;
        if (effect) {
            document.getElementById('targeting-prompt').textContent = effect.description;
            
            // 1. นับจำนวนเป้าหมายที่ถูกต้องทั้งหมดในสนามจริงๆ
            // เราต้องหาจาก gameState โดยตรง ไม่ใช่จาก DOM เพื่อความแม่นยำ
            const targetPlayerState = gameState[targetingState.targetPlayer];
            let numberOfValidTargets = 0;
            if (targetPlayerState && targetPlayerState.field) {
                numberOfValidTargets = targetPlayerState.field.filter(card => {
                    // ใช้เงื่อนไขเดียวกันกับที่ทำให้การ์ดเรืองแสงใน components.js
                    if (effect.keyword === 'force_exhaust' || effect.keyword === 'windstorm') {
                        return card.type === 'Spirit' && !card.isExhausted;
                    }
                    else if (effect.keyword === 'place_core_on_target') {
                        // เป้าหมายคือ Spirit ฝั่งเรา (scope: 'player')
                        return card.type.toLowerCase() === effect.target.type;
                    }
                    else if (effect.keyword === 'cores_charge') {
                        return card.type.toLowerCase() === effect.target.type;
                    }
                    // (เพิ่มเงื่อนไขสำหรับเอฟเฟกต์อื่นๆ ที่นี่ถ้าจำเป็น)
                    return false; // ถ้าไม่เข้าเงื่อนไขไหนเลย ก็ไม่นับ
                }).length;
            }
            
            // 2. หาจำนวนที่เอฟเฟกต์ต้องการ
            const requiredCount = effect.target?.count || 1;

            // 3. จำนวนที่ต้องเลือกจริงๆ คือค่าน้อยที่สุดระหว่างสองค่าบน
            const actualRequiredSelection = Math.min(requiredCount, numberOfValidTargets);

            // 4. อัปเดต UI ตามจำนวนที่ต้องเลือกจริงๆ
            const selectedCount = targetingState.selectedTargets?.length || 0;
            const confirmBtn = document.getElementById('confirm-targets-btn');
            confirmBtn.textContent = `Confirm Targets (${selectedCount}/${actualRequiredSelection})`;
            
            // ปุ่มจะกดได้ก็ต่อเมื่อเลือกครบตามจำนวนที่ต้องเลือกจริงๆ เท่านั้น
            confirmBtn.disabled = selectedCount !== actualRequiredSelection;
        }

    }  else if (discardState.isDiscarding && discardState.playerKey === myPlayerKey) {
        modals.discardOverlay.classList.add('visible');
        const selectedCount = discardState.cardsToDiscard?.length || 0;
        document.getElementById('discard-prompt').textContent = `Please select ${discardState.count} card(s) from your hand to discard. (${selectedCount}/${discardState.count})`;
        document.getElementById('confirm-discard-btn').disabled = selectedCount < discardState.count;
    } else if (effectChoiceState.isChoosing && gameState.turn === myPlayerKey) {
        modals.effectChoiceModal.classList.add('visible');
        if (effectChoiceState.card) {
            document.getElementById('effect-choice-title').textContent = `Choose Effect for ${effectChoiceState.card.name}`;
        }
    } else if (magicPaymentState.isPaying && magicPaymentState.payingPlayer === myPlayerKey) {
        modals.magicPaymentOverlay.classList.add('visible');
        if (magicPaymentState.cardToUse) {
            document.getElementById('magic-payment-title').textContent = `Use Magic: ${magicPaymentState.cardToUse.name}`;
            document.getElementById('magic-payment-cost-value').textContent = magicPaymentState.costToPay;
            document.getElementById('magic-payment-selected-value').textContent = magicPaymentState.selectedCores.length;
            document.getElementById('confirm-magic-btn').disabled = magicPaymentState.selectedCores.length < magicPaymentState.costToPay;
        }
    } else if (summoningState.isSummoning && summoningState.summoningPlayer === myPlayerKey) {
        modals.summonPaymentOverlay.classList.add('visible');
        if (summoningState.cardToSummon) {
            document.getElementById('summon-payment-title').textContent = `Summoning ${summoningState.cardToSummon.name}`;
            document.getElementById('payment-cost-value').textContent = summoningState.costToPay;
            document.getElementById('payment-selected-value').textContent = summoningState.selectedCores.length;
            document.getElementById('confirm-summon-btn').disabled = summoningState.selectedCores.length < summoningState.costToPay;
        }
    } else if (placementState.isPlacing && placementState.placingPlayer === myPlayerKey) {
        modals.placementOverlay.classList.add('visible');
        const targetCard = gameState[myPlayerKey].field.find(s => s.uid === placementState.targetSpiritUid);
        if (targetCard) {
            document.getElementById('placement-title').textContent = `Place Cores on ${targetCard.name}`;
            document.getElementById('confirm-placement-btn').disabled = (targetCard.type === 'Spirit' && targetCard.cores.length === 0);
        }
    } else if (coreRemovalConfirmationState.isConfirming && gameState.turn === myPlayerKey) {
        modals.coreRemovalConfirmationOverlay.classList.add('visible');
    }
    // ลำดับ 3: Modal ที่เกี่ยวกับ Battle
    else if (flashState.isActive && flashState.priority === myPlayerKey) {
        modals.flashOverlay.classList.add('visible');
        document.getElementById('flash-title').textContent = `Flash Timing (${flashState.priority}'s Priority)`;
    }else if (attackState.isAttacking && attackState.defender === myPlayerKey && !flashState.isActive && !targetingState.isTargeting) {
        modals.defenseOverlay.classList.add('visible');
        const attackerPlayerKey = myPlayerKey === 'player1' ? 'player2' : 'player1';
        const attacker = gameState[attackerPlayerKey]?.field.find(s => s.uid === attackState.attackerUid);
        
        if (attacker) {
            const { bp } = getSpiritLevelAndBP(attacker, attackerPlayerKey, gameState);
            document.getElementById('defense-attacker-info').textContent = `Attacker: ${attacker.name} (BP: ${bp})`;
        }

        // ++ เพิ่ม Logic การตรวจสอบ Clash เข้ามาตรงนี้ ++
        const takeDamageBtn = document.getElementById('take-damage-btn');
        if (attackState.isClash) {
            const potentialBlockers = gameState[myPlayerKey].field.filter(s => s.type === 'Spirit' && !s.isExhausted);
            
            // ตรวจสอบว่ามี Blocker ที่ "ไม่ติด Armor" หรือไม่
            const hasValidBlocker = potentialBlockers.some(blocker => 
                !isImmune(blocker, attacker, gameState)
            );
            
            if (hasValidBlocker) {
                // ถ้ามีตัวที่บล็อกได้จริงๆ ให้ปิดปุ่มรับดาเมจ
                takeDamageBtn.disabled = true;
                takeDamageBtn.textContent = 'Must Block!';
            } else {
                // ถ้าไม่มีตัวบล็อก (หรือทุกตัวติด Armor) ก็ให้กดรับดาเมจได้
                takeDamageBtn.disabled = false;
                takeDamageBtn.textContent = 'Take Life Damage';
            }
        } else {
            // ถ้าไม่ใช่ Clash ก็ให้ปุ่มทำงานปกติ
            takeDamageBtn.disabled = false;
            takeDamageBtn.textContent = 'Take Life Damage';
        }
    }

    // --- 3. Modal ที่ทำงานแยกต่างหาก ---
    if (gameState.gameover) {
        modals.gameOverModal.classList.add('visible');
        const winnerText = gameState.player1.life <= 0 ? 'Player 2 Wins!' : 'Player 1 Wins!';
        document.getElementById('game-over-message').textContent = winnerText;
    }
}