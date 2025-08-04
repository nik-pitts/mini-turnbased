export function generatePositionString(playerPosition, bossPosition) {
  const line = Array(11).fill("_");
  line[playerPosition] = "P";
  line[bossPosition] = "B";
  return line.join("");
}

export function createTurnLog({
  id,
  playerPosition,
  bossPosition,
  playerAction,
  bossAction,
  playerDamage,
  bossDamage,
  playerHealth,
  bossHealth
}) {
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  let playerSummary = "No action.";
  console.log('Player action:', playerAction);
  if (playerAction?.type === 'attack') {
    playerSummary = bossDamage > 0
      ? `Player Action: Attack. Deal: ${bossDamage} damage.\n`
      : `Player Action: Attack. Deal: missed.\n`;
  } else if (playerAction?.type) {
    playerSummary = `Player Action: ${capitalize(playerAction?.type)}.\n`;
  }

  let bossSummary = "No action.";
  if (bossAction) {
    bossSummary = playerDamage > 0
      ? `Boss Action: "${capitalize(bossAction)}". Deal: ${playerDamage} damage.`
      : `Boss Action: "${capitalize(bossAction)}". Deal: missed.`;
  }

  return {
    id,
    positions: generatePositionString(playerPosition, bossPosition),
    playerAction,
    bossAction,
    results: {
      playerDamage,
      bossDamage,
      playerHealth,
      bossHealth,
    },
    summary: `${playerSummary}\n${bossSummary}`,
  };
}