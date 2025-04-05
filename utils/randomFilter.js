import { gameModes } from "./gameModes.js";

export function selectRandomPromptCategory() {
  const allFields = [...new Set([...gameModes.image, ...gameModes.data])];
  const chosen = allFields[Math.floor(Math.random() * allFields.length)];
  gameModes.prompt = [chosen]; // update prompt mode allowed fields
  return chosen;
}
