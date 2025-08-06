// game_logic/effects.js
const { getSpiritLevelAndBP } = require('./utils.js');
const { applyCrush, applyClash, applyPowerUp, applyDiscard } = require('./effectHandlers.js');

function resolveTriggeredEffects(gameState, card, timing, ownerKey) {
    if (!card.effects || card.effects.length === 0) return gameState;

    const { level: cardLevel } = getSpiritLevelAndBP(card, ownerKey, gameState);

    card.effects.forEach(effect => {
        if (effect.timing === timing && effect.level.includes(cardLevel)) {
            switch (effect.keyword) {
                case 'crush':
                    gameState = applyCrush(gameState, card, cardLevel, ownerKey);
                    break;
                case 'clash':
                    gameState = applyClash(gameState);
                    break;
                case 'power up':
                    if (!effect.triggered_by) {
                       gameState = applyPowerUp(gameState, card.uid, effect.power, effect.duration);
                    }
                    break;
                case 'discard':
                    gameState = applyDiscard(gameState, card, effect, ownerKey);
                    break;
            }
        }
    });
    return gameState;
}

module.exports = { resolveTriggeredEffects };