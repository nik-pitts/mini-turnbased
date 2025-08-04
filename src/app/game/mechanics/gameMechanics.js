
export const playerLogic = {
    warrior: {
        attack: 50,
        range: 2,
        skill: 'Shield',
    },
    thief: {
        attack: 40,
        range: 4,
        skill: 'Evade',
    },
    magician: {
        attack: 30,
        range: 5,
        skill: 'Heal',
    },
}

export const bossLogic = {
    actions: [
        { type: 'short distance attack', damage: 20, reducedDamage: 10, distanceThreshold: [0, 2], effect: "Player with class skill: 0 damage, player without class skill: FULL 20 damage" },
        { type: 'medium distance attack', damage: 15, reducedDamage: 7, distanceThreshold: [3, 5], effect: "Player with class skill: 0 damage, player without class skill: FULL 15 damage" },
        { type: 'long distance attack', damage: 10, reducedDamage: 5, distanceThreshold: [6, 8], effect: "Player with class skill: 0 damage, player without class skill: FULL 10 damage" },
        { type: 'poisoning', distanceThreshold: [1, 10], fullDamage: 12, reducedDamage: -15, effect: "Disrupts player's HEAL skill. Player with class skill: 50% CHANCE of -7 REDUCED damage (gaining health). Player without class skill: 5 FULL damage." },
        { type: 'shield breaker', distanceThreshold: [1, 10], fullDamage: 10, reducedDamage: 5, effect: "Breaks player's SHIELD skill. Player with class skill: 50% CHANCE of 5 REDUCED damage. Player without class skill: 10 FULL damage." },
        { type: 'booby trap', distanceThreshold: [1, 10], fullDamage: 8, reducedDamage: 4, effect: "Cancels player's EVADE skill. Player with class skill: 50% CHANCE of 4 REDUCED damage. Player without class skill: 8 FULL damage." },
    ],
};

export function canAttack(classType, distance) {
  const player = playerLogic[classType];
  if (!player) return false;
  return distance <= player.range;
}

export function getAttackDamage(classType) {
  const player = playerLogic[classType];
  if (!player) return 0;
  return player.attack;
}

export function canBossAttack(action, playerPosition, bossPosition) {
  console.log(action, playerPosition, bossPosition);
  const attack = bossLogic.actions.find(a => a.type === action);

  if (!attack) return false;
  const distance = Math.abs(playerPosition - bossPosition);
  console.log(distance, attack.distanceThreshold);
  const [min, max] = attack.distanceThreshold;
  return distance >= min && distance <= max;
}

export function getBossAttackDamage(bossAction, playerAction, playerClass) {
  const logic = bossLogic.actions.find(a => a.type === bossAction.toLowerCase());
  if (!logic) return 0;

  const trapCounters = {
    'poisoning': 'heal',
    'shield breaker': 'shield',
    'booby trap': 'evade',
  };

  const isTrapAttack = 'fullDamage' in logic && 'reducedDamage' in logic;
  const isGeneralAttack = 'damage' in logic;
  const playerUsedCounter = ['heal', 'shield', 'evade'].includes(playerAction?.type);

  if (isTrapAttack) {
    const expectedCounter = trapCounters[bossAction];

    const classSkill = playerLogic[playerClass]?.skill?.toLowerCase();
    if (expectedCounter !== classSkill) {
      return 0;
    }
    console.log('Expected counter:', expectedCounter, 'Player action:', playerAction?.type);
    if (playerAction?.type === expectedCounter) {
      return Math.random() < 0.5 ? logic.reducedDamage : logic.fullDamage;
    } else {
      return logic.fullDamage;
    }
  }

  if (isGeneralAttack) {
    return playerUsedCounter ? logic.reducedDamage : logic.damage;
  }

  return 0;
}