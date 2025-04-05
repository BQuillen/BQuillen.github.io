import React, { useState } from "react";
import { validateQuery } from "../utils/queryValidator";
import { gameModes } from "../utils/gameModes"; // capitalized!

function QueryBox({ currentMode, promptCategory, onQuerySubmit }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const allowedFields = gameModes[currentMode];
    const errors = validateQuery(query, allowedFields);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    } else {
      setError("");
      onQuerySubmit(query);
    }
  };

  return (
    <div>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='e.g., where Species == "Raccoon"'
      />
      {error && <div className="error">{error}</div>}
      <button onClick={handleSubmit}>Submit Query</button>
    </div>
  );
}

export default QueryBox;
