import React, { useState, useEffect } from 'react';
import QueryBox from './Components/QueryBox';
import { selectRandomFilter } from './utils/randomFilter';
import { gameModes } from './Constants/gameModes';
import charactersData from './data/characters.json'; // lowercase path

function App() {
  const [gameMode, setGameMode] = useState("imageOnly");
  const [promptCategory, setPromptCategory] = useState("");
  const [characters, setCharacters] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Load characters once at start
  useEffect(() => {
    // mimic the shuffle from game.js
    const shuffled = charactersData.sort(() => 0.5 - Math.random()).slice(0, 16);
    setCharacters(shuffled);
    setFiltered(shuffled);
  }, []);

  export default function App() {
    console.log("✅ React is running!");
    return <h1>Hello from React</h1>;
  }
  


  // Handle prompt challenge filter
  useEffect(() => {
    if (gameMode === "promptChallenge") {
      const category = selectRandomFilter();
      setPromptCategory(category);
    }
  }, [gameMode]);

  const handleQuery = (query) => {
    try {
      const fn = new Function("character", `
        return ${query
          .replace(/where/i, "")
          .replace(/==/g, "===")
          .replace(/contains/g, "includes")
          .replace(/has/g, "includes")};
      `);

      const results = characters.filter(fn);
      setFiltered(results);
    } catch (e) {
      console.error("Query error:", e);
    }
  };

  return (
    <div>
      <h1>🎲 Guess QL</h1>
      <QueryBox
        currentMode={gameMode}
        promptCategory={promptCategory}
        onQuerySubmit={handleQuery}
      />

      <div className="grid">
        {filtered.map((char) => (
          <div key={char.Name} className="card">
            <img src={`/Images/${char.Name}.png`} alt={char.Name} />
            <p>{char.Name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
