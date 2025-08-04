'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [selectedClass, setSelectedClass] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedClass) {
      router.push(`/game?class=${selectedClass}`);
    }
  }, [selectedClass, router]);

  const classData = [
    {
      key: "warrior",
      name: "Warrior",
      image: "/images/warrior.webp",
      description:
        "Warrior description.",
      attack: 9,
      range: 2,
      skill: "Defend",
    },
    {
      key: "thief",
      name: "Thief",
      image: "/images/thief.webp",
      description:
        "Thief description.",
      attack: 7,
      range: 3,
      skill: "Evade",
    },
    {
      key: "magician",
      name: "Magician",
      image: "/images/magician.webp",
      description:
        "Magician description.",
      attack: 5,
      range: 5,
      skill: "Heal",
    },
  ];

  return (
    <div className="container">
      <h1>LLM Turnbased Maple</h1>
      <h2>Choose Your Class</h2>
      <p>
        Select a class to start your adventure in the LLM Turnbased Maple.
        Each class has unique abilities and skills.
      </p>

      <div className="classes-container">
        {classData.map((cls) => (
          <div
            key={cls.key}
            className={`class-card ${cls.key} ${selectedClass === cls.key ? "selected" : ""}`}
            onClick={() => setSelectedClass(cls.key)}
          >
            <div className="class-name">{cls.name}</div>
            <Image
              src={cls.image}
              alt={cls.name}
              width={120}
              height={120}
              className="class-image"
            />
            <div className="class-description">{cls.description}</div>
            <div className="stats-container">
              <div className="stat-row">
                <span className="stat-name">Attack Strength</span>
                <div className="stat-bar">
                  <div className="stat-fill" style={{ width: `${cls.attack * 10}%` }}></div>
                </div>
                <span className="stat-value">{cls.attack}</span>
              </div>
              <div className="stat-row">
                <span className="stat-name">Attack Distance</span>
                <div className="stat-bar">
                  <div className="stat-fill" style={{ width: `${cls.range * 10}%` }}></div>
                </div>
                <span className="stat-value">{cls.range}</span>
              </div>
              <div className="stat-row">
                <span className="stat-name">Skill</span>
                <span className="stat-value">{cls.skill}</span>
              </div>
            </div>
            <button className="confirm-btn">Yes, I am a {cls.name}</button>
          </div>
        ))}
      </div>
    </div>
  );
}