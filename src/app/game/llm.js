import { InferenceClient } from "@huggingface/inference";
import { playerLogic, bossLogic } from './mechanics/gameMechanics';
// TODO: Replace with your actual Hugging Face token.
const HF_TOKEN = '<YOUR TOKEN HERE>';
const client = new InferenceClient(HF_TOKEN);

const actionsDescription = generateBossPrompt(bossLogic);
function generateBossPrompt(bossLogic) {
  const actionsText = bossLogic.actions.map((action, idx) => {
    if ('damage' in action) {
      // General attack
      return `${idx + 1}. Name: ${action.type}, Effect: ${action.damage} damage (effective at range ${action.distanceThreshold[0]}-${action.distanceThreshold[1]})`;
    } else {
      // Skill-based attack with full/reduced damage and effect description
      return `${idx + 1}. Name: ${action.type}, Effect: ${action.effect}`;
    }
  }).join('\n');
  return actionsText
}
const createBossPrompt = ({ selectedClass, playerHealth, playerSkill, prevPlayerPosition, bossHealth }) => {
    const playerStats = playerLogic[selectedClass];
    const promt =  `You are a tactical boss AI in turn-based combat against a player.

        [Game State]
        PLAYER CLASS: ${selectedClass}
        - Player abilities: Attack: ${playerStats.attack}, Range: ${playerStats.range}, Skill: ${playerStats.skill}

        PLAYER STATUS:
        - Health: ${playerHealth}%
        - Skill Points: ${playerSkill}% (costs -20 points per skill use)
        - Previous round position: ${prevPlayerPosition}
        - Can move to any position 1-10 each turn. Current position may not be the same as previous round.

        BOSS STATUS (YOU):
        - Health: ${bossHealth}%
        - Can move to any position 1-10 each turn

        [YOUR AVAILABLE ACTIONS]
        - Below is the list of your available actions you can take:
        ${actionsDescription}

        [DAMAGE CALCULATION LOGIC]
        - If you use a SKILL ATTACK and the player uses the countered skill, they receive 50% of reduced skill damage.
        - If you use a SKILL ATTACK and the player does NOT use the countered skill, they take FULL skill damage.
        - If you use a GENERAL ATTACK and the player uses skill that corresponds to their class skill (HEAL, SHIELD, EVADE), they receive 0 damage (fully protected).
        - If you use a GENERAL ATTACK and the player does NOT use any skill, they take full general attack damage.
        - If you use a SKILL ATTACK that does not corresponds to player's class (magician : poisoning, thief : booby trap, warrior: shield breaker), they receive 0 damage.

        [YOUR TACTICAL NOTES]
        - Distance = |your_position - player_position|
        - Player may move from position ${prevPlayerPosition} to anywhere 1-10
        - You may move from your current position to anywhere 1-10 considering your attack range and player's future position
        - Consider player's class abilities when choosing strategy

        [YOUR INSTRUCTIONS]
        1. Provide detailed strategic reasoning about the current situation
        2. Explain your chosen action and position
        3. End with EXACTLY this format (no variations):

        REASONING: [your detailed tactical analysis]
        FINAL ACTION: [EXACT and ONLY action NAME from list above]
        FINAL POSITION: [number 1-10]
    `;
    return promt;
}


export async function generateBossResponse(selectedClass, prevPlayerPosition, playerHealth, playerSkill, bossHealth) {
    try {
        const chatCompletion = await client.chatCompletion({
            model: "meta-llama/Meta-Llama-3-8B-Instruct",
            messages: [
                {
                    role: "user",
                    content: createBossPrompt({
                        selectedClass,
                        playerHealth,
                        playerSkill,
                        prevPlayerPosition,
                        bossHealth
                    }),
                },
            ],
        });
        const fullMessage = chatCompletion.choices[0].message.content;
        if (fullMessage) {
            return fullMessage
        }
        return "Uh-oh, my brain is not working right now."
    } catch (error) {
        console.error('Error generating boss response:', error);
    }
}
