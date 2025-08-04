'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import './result.css';


export default function ResultPage() {
    const searchParams = useSearchParams();
    const file = searchParams.get('file');
    const [logs, setLogs] = useState(null);
    const router = useRouter();

    useEffect(() => {
        if (file) {
            fetch(file)
            .then(res => res.json())
            .then(data => setLogs(data));
        }
    }, [file]);

    if (!logs) {
        return <div>Loading...</div>;
    }

    console.log('Logs:', logs);
    const lastHealthLog = logs[logs.length - 1].results;
    const playerHealth = lastHealthLog?.playerHealth;
    const bossHealth = lastHealthLog?.bossHealth;

    let winnerText = 'Game Over';
    if (playerHealth <= 0 && bossHealth <= 0) {
        winnerText = 'Draw.';
    } else if (playerHealth <= 0) {
        winnerText = 'Boss Won.';
    } else if (bossHealth <= 0) {
        winnerText = 'You Won.';
    }

    return (
        <div className="result-container">
            <h1>{winnerText}</h1>
            <h2>Run Results</h2>

            {logs.map(log => (
            <pre key={log.id}>{JSON.stringify(log, null, 2)}</pre>
            ))}
            <div className="button-container">
                <button className="game-btn" onClick={() => router.push('/')}>Replay</button>
            </div>
        </div>
    );
}