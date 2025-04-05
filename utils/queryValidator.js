import { gameModes } from "./gameModes.js";

export function validateQuery(query, mode, promptCategory) {
  const errors = [];

  if (!query.toLowerCase().trim().startsWith("where ")) {
    errors.push("Query must start with 'where'.");
  }

  if (/[^=!<>]=[^=]/.test(query)) {
    errors.push("Use '==' for comparisons, not '='.");
  }

  const validFields = gameModes[mode];
  const fieldRegex = /\b(\w+)\b/g;
  const foundFields = [...query.matchAll(fieldRegex)].map(m => m[1]);

  const invalid = foundFields.filter(f => !validFields.includes(f));
  if (mode === "prompt" && promptCategory && !foundFields.includes(promptCategory)) {
    errors.push(`You may only use: ${promptCategory}`);
  } else if (invalid.length > 0) {
    errors.push(`Invalid field(s) for this mode: ${invalid.join(", ")}`);
  }

  return errors;
}
