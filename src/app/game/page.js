// for user interaction e.g. clicks, drags, etc.
'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import './game.css';
import { generateBossResponse } from './llm';
import { canAttack, getAttackDamage, canBossAttack, getBossAttackDamage } from './mechanics/gameMechanics';
import { createTurnLog } from '../utils/logger';

export default function GamePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedClass = searchParams.get('class');

    const classImageMap = {
        warrior: '/images/warrior.webp',
        thief: '/images/thief.webp',
        magician: '/images/magician.webp',
    };

    const skillMap ={
        warrior: 'defend',
        thief: 'evade',
        magician: 'heal',   
    }

    const playerImage = classImageMap[selectedClass];

    const lineRef = useRef(null);
    const [playerPosition, setPlayerPosition] = useState(10);
    const [prevPlayerPosition, setPrevPlayerPosition] = useState(10);
    const [bossPosition, setBossPosition] = useState(0);

    const [turn, setTurn] = useState('player');

    const [bossMessage, setBossMessage] = useState("You dare challenge me?");
    const [bossRationale, setBossRationale] = useState("This is how I strategized my next move.");

    const [playerHealth, setPlayerHealth] = useState(100);
    const [playerSkill, setPlayerSkill] = useState(100);
    const [bossHealth, setBossHealth] = useState(100);

    const [showRationale, setShowRationale] = useState(false);

    const [playerAction, setPlayerAction] = useState(null);
    const [bossAction, setBossAction] = useState(null);
    const [bossTargetPosition, setBossTargetPosition] = useState(null);

    const [turnLogs, setTurnLogs] = useState([]);
    const [turnCount, setTurnCount] = useState(1);
    const [hasSavedRun, setHasSavedRun] = useState(false);

    useEffect(() => {
    if (turn === 'boss') {
        const timer = setTimeout(async () => {
            const response = await generateBossResponse(
                selectedClass,
                prevPlayerPosition,
                playerHealth,
                playerSkill,
                bossHealth
            );

            if (!response) {
                console.error("Failed to generate boss response");
                return;
            }

            setBossRationale(response);

            const lines = response.split('\n').map(line => line.trim());

            const finalActionLine = lines.find(line => line.toLowerCase().includes("final action:"));
            const finalPositionLine = lines.find(line => line.toLowerCase().includes("final position:"));

            if (finalActionLine && finalPositionLine) {
                const finalAction = finalActionLine.split(':').slice(1).join(':').trim();
                const finalPosition = parseInt(finalPositionLine.split(':').slice(1).join(':').trim(), 10);

                setBossMessage(finalAction);
                setBossAction(finalAction);
                setBossTargetPosition(finalPosition);
                setTurn('resolving');
            } else {
                console.error("Failed to extract boss final action or position");
                console.log("Full boss response:\n", response);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }
    }, [turn]);

    useEffect(() => {
        if (turn === 'resolving') {

            let playerDamageDealt = 0;
            let bossDamageDealt = 0;
            let newPlayerHealth = playerHealth;
            let newBossHealth = bossHealth;

            // Boss
            if (typeof bossTargetPosition === 'number') {
                setBossPosition(bossTargetPosition);
            }
            if (bossAction && canBossAttack(bossAction, playerPosition, bossTargetPosition)) {
                const damage = getBossAttackDamage(bossAction, playerAction, selectedClass);
                bossDamageDealt = damage;
                newPlayerHealth = Math.max(playerHealth - damage, 0);
                setPlayerHealth(newPlayerHealth);                
                console.log(`Boss dealt ${damage} damage`);
            } else {
                console.log('Boss missed the attack!');
            }

            // Update boss movement
            if (typeof bossTargetPosition === 'number') {
                setBossPosition(bossTargetPosition);
            }

            // Player
            if (playerAction?.type === 'attack') {
                const distance = Math.abs(playerPosition - bossTargetPosition);
                if (canAttack(selectedClass, distance)) {
                    const damage = getAttackDamage(selectedClass);
                    playerDamageDealt = damage;
                    newBossHealth = Math.max(bossHealth - damage, 0);
                    setBossHealth(newBossHealth);
                    console.log(`Player dealt ${damage} damage`);
                } else {
                    console.log('Player attack missed');
                }
            } else if (playerAction?.type === skillMap[selectedClass].toLowerCase()) {
                // Skill bar reduces
                setPlayerSkill(prev => Math.max(prev - 10, 0));
            }

            const logEntry = createTurnLog({
                id: turnCount,
                playerPosition,
                bossPosition: bossTargetPosition,
                playerAction: playerAction,
                bossAction: bossAction,
                playerDamage: bossDamageDealt,
                bossDamage: playerDamageDealt,
                playerHealth: newPlayerHealth,
                bossHealth: newBossHealth
            });

            setTurnLogs(prev => [...prev, logEntry]);

            const gameEnded = newPlayerHealth <= 0 || newBossHealth <= 0;
            if (gameEnded && !hasSavedRun) {
                if (newPlayerHealth <= 0 ) {
                    setBossMessage("Haha. You loser.");
                } else {
                    setBossMessage("Will revenge.");
                }
                setHasSavedRun(true);
                
                const finalLogs = [...turnLogs, logEntry];
                
                fetch('/api/save-run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalLogs)
                })
                .then(response => response.json())
                .then(result => {
                    console.log('Run saved:', result);
                    setTimeout(() => {
                        router.push(`/result?file=${encodeURIComponent(result.file)}`);
                    }, 2000);                    
                })
                .catch(error => {
                    console.error('Failed to save run:', error);
                });
            }

            setTurnCount(prev => prev + 1);

            // Reset
            setPlayerAction(null);
            setBossAction(null);
            setBossTargetPosition(null);
            setTurn('player');
        }
    }, [turn]);

    const handleMouseDown = (e) => {
        const handleMouseMove = (eMove) => {
            const rect = lineRef.current.getBoundingClientRect();
            const relativeX = eMove.clientX - rect.left;
            const tickWidth = rect.width / 10;
            const snappedIndex = Math.round(relativeX / tickWidth);
            const clampedIndex = Math.max(0, Math.min(snappedIndex, 10));
            setPrevPlayerPosition(playerPosition);
            setPlayerPosition(clampedIndex);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleAttack = () => {
        if (turn !== 'player') return;
        console.log('Player prepares attack!');
        setPlayerAction({ type: 'attack', distance: playerPosition });
        setTurn('boss');
    };

    const handleSkill = () => {
        if (turn !== 'player' || playerSkill < 20) return;
        console.log('Player prepares skill!');
        setPlayerAction({ type: skillMap[selectedClass] });
        setTurn('boss');
    };

  return (
    <>
    <div className="toggle-switch-wrapper">
        <label className="toggle-switch">
            <input
            type="checkbox"
            checked={showRationale}
            onChange={() => setShowRationale(prev => !prev)}
            />
            <span className="slider" />
        </label>
        {showRationale && (
            <div className="rationale-text">
            {bossRationale}
            </div>
        )}
    </div>

    <div className="game-container">
      <h1>Battle Arena</h1>

      <div className="battle-line" ref={lineRef} onMouseDown={handleMouseDown}>
        {[...Array(11)].map((value, index) => (
            <div key={index} className="marker" />
        ))}
        <div className="player-knob" style={{ left: `${(playerPosition / 10) * 100}%` }} onMouseDown={handleMouseDown}/>
        <div className="character boss" style={{ left: `${(bossPosition / 10) * 100}%` }}>
            {turn === 'boss' && (
                <Image src="/images/turn.png" alt="Turn Indicator" width={16} height={16} className="turn-indicator-img"/>
            )}
            <div className="speech-bubble">{bossMessage}</div>
            <Image src="/images/boss.webp" alt="Boss" width={50} height={50} />
            <div className="bars">            
            <div className="bar health-bar">
                <div className="fill" style={{ width: `${bossHealth}%`, backgroundColor: 'red' }} />
            </div>
        </div>
      </div>
        <div className="character player" style={{ left: `${(playerPosition / 10) * 100}%` }}>
            {turn === 'player' && (
                <Image src="/images/turn.png" alt="Turn Indicator" width={16} height={16} className="turn-indicator-img"/>
            )}
            <Image src={playerImage} alt="Player" width={50} height={50} />
            <div className="bars">
                <div className="bar health-bar">
                    <div className="fill" style={{ width: `${playerHealth}%`, backgroundColor: 'red' }} />
                </div>
                <div className="bar skill-bar">
                    <div className="fill" style={{ width: `${playerSkill}%`, backgroundColor: 'blue' }} />
                </div>
            </div>
        </div>
        </div>
        <div className="button-container">
            <button className="game-btn" onClick={handleAttack}>Attack</button>
            <button className="game-btn" onClick={handleSkill}>{skillMap[selectedClass]}</button>
        </div>
        {turnLogs.length > 0 && (
            <div className="turn-log-container">
            <h2>Turn {turnLogs[turnLogs.length - 1].id}</h2>
            <p><strong>Positions:</strong> {turnLogs[turnLogs.length - 1].positions}</p>
            {turnLogs[turnLogs.length - 1].summary
                .split('\n')
                .map((line, i) => (
                <div key={i}>{line}</div>
                ))}
            </div>
        )}
    </div>
    </>
  );
}