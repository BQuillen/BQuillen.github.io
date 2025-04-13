let characters = [];
let visibleCharacters = [];
let target = null;
let queryCount = 0;
let queryHistory = [];
let promptCategory = null;
let eliminatedCharacters = new Set();
let hasWon = false;
let currentPromptField = null;




const fields = [
  "LoginAccount", "Hostname", "IP", "VisitedDomains", "FilesDownloaded", "ColorScheme",
  "ProcessesRun", "SuspiciousActivity", "Species", "Hair", "Accessory"
];
const operators = ["==", "!=", "contains", "!contains", "has", "has_any"];

const gameModes = {
  normal: [
    "Species", "Hair", "Accessory", "ColorScheme",
    "VisitedDomains", "FilesDownloaded", "Hostname", "IP", "SuspiciousActivity", "LoginAccount"
  ],
  image: ["Species", "Hair", "Accessory", "ColorScheme"],
  data: ["VisitedDomains", "FilesDownloaded", "Hostname", "IP", "SuspiciousActivity", "LoginAccount"],
  prompt: []
};

function selectRandomPromptCategory() {
  const promptFields = [
    "Species",
    "Accessory",
    "ColorScheme",
    "VisitedDomains",
    "FilesDownloaded",
    "Hostname",
    "IP",
    "ProcessesRun"
  ];
  const chosen = promptFields[Math.floor(Math.random() * promptFields.length)];
  gameModes.prompt = [chosen];
  return chosen;
}


function validateQuery(query, mode, promptField) {
  const errors = [];
  if (!query.toLowerCase().trim().startsWith("where ")) {
    errors.push("Query must start with 'where'.");
  }
  if (/[^=!<>]=[^=]/.test(query)) {
    errors.push("Use '==' for comparisons, not '='.");
  }

  if (mode === "prompt" && promptField) {
    const queryLower = query.toLowerCase();
    const fieldLower = promptField.toLowerCase();

    const isGuessingName =
      queryLower.includes('name ==') || queryLower.includes('name contains');

    if (!isGuessingName && !queryLower.includes(fieldLower)) {
      errors.push(`You may only use: ${promptField}`);
    }
  }

  return errors; // ← You were missing this
}

  
function fisherYatesShuffle(array) {
  let m = array.length, t, i;

  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

  

async function loadCharacters() {
  const res = await fetch("data/characters.json");
  const allCharacters = await res.json();
  characters = fisherYatesShuffle(allCharacters).slice(0, 16);
  visibleCharacters = [...characters];
  eliminatedCharacters = new Set();
  hasWon = false;


  target = characters[Math.floor(Math.random() * characters.length)];
  document.getElementById("targetDisplay").textContent = `Who is the suspect?`;
  document.getElementById("targetImg").src = "images/target-placeholder.png";
  document.querySelectorAll(".character-card").forEach(card => {
    card.style.boxShadow = "none";
  });
  
  queryCount = 0;
  queryHistory = [];
  promptCategory = null;
  currentPromptField = null;
const promptBox = document.getElementById("promptInstruction");
if (promptBox) {
  promptBox.style.display = "none";
  promptBox.innerHTML = "";
}
  document.getElementById("queryCounter").textContent = `🔁 Queries Used: ${queryCount}`;
  document.getElementById("celebration").style.display = "none";
  document.getElementById("queryFeedback").innerText = "";
  document.getElementById("queryLog").innerHTML = "<strong>Query History:</strong><br/>";
  document.getElementById("kqlInput").value = "";

  renderCharacters(characters, visibleCharacters);
  setupKQLKeyboard();
  
  // ✅ Ensure prompt is regenerated if in prompt mode
const mode = document.getElementById("modeSelect").value;
if (mode === "prompt") {
  currentPromptField = selectRandomPromptCategory();
  const promptBox = document.getElementById("promptInstruction");
  promptBox.style.display = "block";
  promptBox.innerHTML = `🎯 Use only this filter category: <strong>${currentPromptField}</strong>`;
}


}

function setupKQLKeyboard() {
  const fieldSelect = document.getElementById("fieldSelect");
  const opSelect = document.getElementById("opSelect");
  const valInput = document.getElementById("valInput");

  fieldSelect.innerHTML = fields.map(f => `<option value="${f}">${f}</option>`).join("");
  opSelect.innerHTML = operators.map(o => `<option value="${o}">${o}</option>`).join("");

  document.getElementById("addClause").onclick = () => {
    const field = fieldSelect.value;
    const op = opSelect.value;
    const val = valInput.value.trim();
    if (!field || !op || !val) return;

    let clause = `where ${field} ${op} "${val}"`;
    document.getElementById("kqlInput").value = clause;
  };
}

document.getElementById("modeSelect").addEventListener("change", () => {
  const mode = document.getElementById("modeSelect").value;
  const promptBox = document.getElementById("promptInstruction");

  if (mode === "prompt") {
    currentPromptField = selectRandomPromptCategory();
    promptBox.style.display = "block";
    promptBox.innerHTML = `🎯 Use only this filter category: <strong>${currentPromptField}</strong>`;
  } else {
    currentPromptField = null;
    promptBox.style.display = "none";
    promptBox.innerHTML = "";
  }
});



function runQuery() {
  const query = document.getElementById("kqlInput").value;
  const mode = document.getElementById("modeSelect").value;

  if (!query.trim()) return;

  if (mode === "prompt" && !currentPromptField) {
    currentPromptField = selectRandomPromptCategory();
    document.getElementById("queryFeedback").innerText =
      `🎯 This round's filter: ${currentPromptField}`;
    document.getElementById("queryFeedback").style.color = "gold";
  }

  const errors = validateQuery(query, mode, currentPromptField);
  if (errors.length > 0) {
    document.getElementById("queryFeedback").innerText = `❌ ${errors.join("\n")}`;
    document.getElementById("queryFeedback").style.color = "red";
    return;
  }

  const targetMatches = checkQueryAgainstTarget(query);
  queryHistory.push({ text: query, match: targetMatches });
  updateQueryLog();

  if (targetMatches) {
    document.getElementById("queryFeedback").innerText =
      "✅ Yes! You're one step closer to finding the attacker.";
    document.getElementById("queryFeedback").style.color = "green";

    const matching = characters.filter(c => evaluateQuery(query, c));
    visibleCharacters = characters.filter(c => !eliminatedCharacters.has(c.Name) && matching.includes(c));
    characters.forEach(c => {
      if (!matching.includes(c)) eliminatedCharacters.add(c.Name);
    });

    if (mode === "prompt") {
      currentPromptField = selectRandomPromptCategory();
      const promptBox = document.getElementById("promptInstruction");
      if (promptBox) {
        promptBox.innerHTML = `🎯 Use only this filter category: <strong>${currentPromptField}</strong>`;
      }
    }
  } else {
    document.getElementById("queryFeedback").innerText =
      "❌ Hmm... That doesn't seem to help.";
    document.getElementById("queryFeedback").style.color = "red";
  }

  queryCount++;
  document.getElementById("queryCounter").textContent = `🔁 Queries Used: ${queryCount}`;
  document.getElementById("kqlInput").value = "";

  // ✅ Always re-render the board after a query
  renderCharacters(characters, visibleCharacters);
  checkWinCondition(query);
}



  
  
function evaluateQuery(query, char) {
  if (!query.toLowerCase().trim().startsWith("where")) return true;
  const logic = query.trim().slice(5).trim();

  try {
    const filterFunc = new Function("char", `
      const val = key => {
        const v = char[key];
        return typeof v === 'string' ? v.toLowerCase() : v;
      };

      return ${logic
        .replace(/(\w+)\s+contains\s+"([^"]+)"/gi, 'val("$1").includes("$2".toLowerCase())')
        .replace(/(\w+)\s+!contains\s+"([^"]+)"/gi, '!val("$1").includes("$2".toLowerCase())')
        .replace(/(\w+)\s+has\s+"([^"]+)"/gi, '(Array.isArray(char.$1) ? char.$1.includes("$2") : char.$1 === "$2")')
        .replace(/(\w+)\s+has_any\s+"([^"]+)"/gi, '(Array.isArray(char.$1) ? "$2".split(",").map(s => s.trim()).some(val => char.$1.includes(val)) : false)')
        .replace(/(\w+)\s+==\s+"([^"]+)"/gi, 'val("$1") === "$2".toLowerCase()')
        .replace(/(\w+)\s+!=\s+"([^"]+)"/gi, 'val("$1") !== "$2".toLowerCase()')
        .replace(/(\w+)\s+==\s+(true|false)/gi, 'char.$1 === $2')
      };
    `);
    return filterFunc(char);
  } catch (e) {
    console.warn("Query evaluation error:", e);
    return true;
  }
}

  

  function updateQueryLog() {
    const logDiv = document.getElementById("queryLog");
    logDiv.innerHTML = "<strong>Query History:</strong><br/>" +
      queryHistory.map((q, i) => {
        const isMatch = checkQueryAgainstTarget(q.text); // ✅ fix here
        const bgColor = isMatch ? "#d4f4dd" : "#f8d7da";
        const border = isMatch ? "1px solid #5cb85c" : "1px solid #d9534f";
        return `
          <div style="
            background: ${bgColor};
            border: ${border};
            color: black;
            padding: 4px;
            margin-bottom: 2px;
          ">
            #${i + 1}: ${q.text}
          </div>
        `;
      }).join("");
  }
  
  
  

  function queryCharacters(query) {
    if (!query.trim().toLowerCase().startsWith("where")) return characters;
    const logic = query.trim().slice(5).trim();
  
    return characters.filter(char => {
      try {
        const filterFunc = new Function("char", `
          const val = key => {
            const v = char[key];
            return typeof v === 'string' ? v.toLowerCase() : v;
          };
  
          return ${logic
            .replace(/(\w+)\s+contains\s+"([^"]+)"/gi, 'val("$1").includes("$2".toLowerCase())')
            .replace(/(\w+)\s+!contains\s+"([^"]+)"/gi, '!val("$1").includes("$2".toLowerCase())')
            .replace(/(\w+)\s+has\s+"([^"]+)"/gi, '(Array.isArray(char.$1) ? char.$1.includes("$2") : char.$1 === "$2")')
            .replace(/(\w+)\s+has_any\s+"([^"]+)"/gi, '(Array.isArray(char.$1) ? "$2".split(",").map(s => s.trim()).some(val => char.$1.includes(val)) : false)')
            .replace(/(\w+)\s+==\s+"([^"]+)"/gi, 'val("$1") === "$2".toLowerCase()')
            .replace(/(\w+)\s+!=\s+"([^"]+)"/gi, 'val("$1") !== "$2".toLowerCase()')
            .replace(/(\w+)\s+==\s+(true|false)/gi, 'char.$1 === $2')
        };
        `);
        return filterFunc(char);
      } catch (e) {
        console.error("Query parsing error:", e);
        return true;
      }
    });
  }
  

function renderCharacters(all, visible) {
    const grid = document.getElementById("characters");
    grid.innerHTML = "";
  
    const mode = document.getElementById("modeSelect").value;
  
    all.forEach(char => {
      const card = document.createElement("div");
      card.className = "character-card";
      card.style.fontFamily = "Arial, sans-serif";
      card.style.fontSize = "0.75rem";
  
      if (eliminatedCharacters.has(char.Name)) {
        card.style.opacity = 0.2;
        card.style.filter = "grayscale(100%)";
      } else {
        card.style.opacity = 1;
        card.style.filter = "none";
      }
  
      if (char.Name === target.Name && hasWon) {
        card.style.boxShadow = "0 0 15px 5px limegreen";
        card.classList.add("wiggle"); // 🎉 Add wiggle animation
      }
  
      const img = document.createElement("img");
      img.src = char.Image;
      img.alt = char.Name;
  
      const info = document.createElement("div");
      let dataHTML = `<strong>${char.Name}</strong><br/>`;
  
      if (mode !== "image") {
        dataHTML += `
          <strong>Hostname:</strong> ${char.Hostname}<br/>
          <strong>IP:</strong> ${char.IP}<br/>
          <strong>Login:</strong> ${char.LoginAccount}<br/>
          <strong>Visited:</strong>
          <ul style="margin: 0; padding-left: 1rem;">${char.VisitedDomains?.map(d => `<li>${d}</li>`).join("")}</ul>
          <strong>Files:</strong> ${char.FilesDownloaded?.join(", ")}<br/>
          <strong>Activity:</strong> ${char.SuspiciousActivity}<br/>
         <strong>Processes:</strong>
            <ul style="margin: 0 0 0.3rem; padding-left: 1rem;">
            ${char.ProcessesRun?.map(p => `<li>${p}</li>`).join("")}
            </ul>
          <span style="display:none"><strong>Species:</strong> ${char.Species}</span>
          <span style="display:none"><strong>Hair:</strong> ${char.Hair}</span>
          <span style="display:none"><strong>Glasses:</strong> ${char.Glasses}</span>
          <span style="display:none"><strong>Accessory:</strong> ${char.Accessory}</span>
          <span style="display:none"><strong>Hat:</strong> ${char.Hat}</span>
        `;
      }
  
      info.innerHTML = dataHTML;
      if (mode !== "data") card.appendChild(img);
      card.appendChild(info);
      grid.appendChild(card);
    });
  }
  

  function checkQueryAgainstTarget(query) {
    const logic = query.trim().slice(5).trim();
    try {
      const evalTarget = new Function("char", `
        const val = key => {
          const v = char[key];
          return typeof v === 'string' ? v.toLowerCase() : v;
        };
  
        return ${logic
          .replace(/(\w+)\s+contains\s+"([^"]+)"/gi, 'val("$1").includes("$2".toLowerCase())')
          .replace(/(\w+)\s+!contains\s+"([^"]+)"/gi, '!val("$1").includes("$2".toLowerCase())')
          .replace(/(\w+)\s+has\s+"([^"]+)"/gi, '(Array.isArray(char.$1) ? char.$1.includes("$2") : char.$1 === "$2")')
          .replace(/(\w+)\s+has_any\s+"([^"]+)"/gi, '(Array.isArray(char.$1) ? "$2".split(",").map(s => s.trim()).some(val => char.$1.includes(val)) : false)')
          .replace(/(\w+)\s+==\s+"([^"]+)"/gi, 'val("$1") === "$2".toLowerCase()')
          .replace(/(\w+)\s+!=\s+"([^"]+)"/gi, 'val("$1") !== "$2".toLowerCase()')
          .replace(/(\w+)\s+==\s+(true|false)/gi, 'char.$1 === $2')
      };
      `);
      return evalTarget(target);
    } catch (e) {
      console.warn("Unable to evaluate query against target.", e);
      return false;
    }
  }
  
  ;


  function checkWinCondition(query) {
    const targetName = target.Name.toLowerCase();
    const isExactMatch = query.toLowerCase().includes('name ==') && query.toLowerCase().includes(`"${targetName}"`);
    const containsMatch = query.toLowerCase().includes('name contains') && targetName.includes(getValueFromQuery(query));
  
    if (isExactMatch) {
      hasWon = true;
      document.getElementById("celebration").style.display = "block";
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play();
      if (window.confetti) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      document.getElementById("targetImg").src = target.Image;
      document.getElementById("queryFeedback").innerText =
        `🎉 You caught ${target.Name}! It took you ${queryCount} queries.`;
        const nameReveal = document.getElementById("targetNameReveal");
        nameReveal.textContent = `🎯 ${target.Name}`;
        nameReveal.style.display = "block";
         
      document.getElementById("queryFeedback").style.color = "green";
      renderCharacters(characters, visibleCharacters); // ✅ Update to show glow + wiggle
    }
  }
  

  
  function getValueFromQuery(query) {
    const match = query.match(/name\s+contains\s+"([^"]+)"/i);
    return match ? match[1].toLowerCase() : "";
  }
  
  

window.onload = () => {
  loadCharacters();
}

const filterData = {
  Species: ["human", "lizard", "bird", "raccoon", "monster", "cat", "dog", "robot", "crab", "ferret"],
  Hair: ["black", "white", "brown", "blue", "green", "pink", "etc."],
  Accessory: ["glasses", "backpack", "drink", "food", "headphones", "watch", "etc."],
  ColorScheme: ["black", "white", "gray", "red", "blue", "orange", "etc."],
  Hostname: ["computer", "device", "laptop", "mobile"],
  IP: ["10.0.0.X", "172.16.X.X", "192.168.X.X"],
  VisitedDomains: ["sketchydocs.io", "raisinkanes.com", "phishynews.net", "kc7cyber.com", "etc."],
  FilesDownloaded: ["Invoice.docx", "Resume.pdf", "RansomNote.txt", "etc."],
  SuspiciousActivity: ["clicked phishing ad", "malware download", "unauthorized login", "etc."],
  LoginAccount: ["related to their name", "jdoe", "admin", "guest", "itadmin"]
};

let activeAccordion = null;

function createFilterAccordion() {
  const list = document.getElementById("filterList");
  list.innerHTML = "";

  Object.entries(filterData).forEach(([filterName, values]) => {
    const item = document.createElement("li");
    item.className = "filter-item";

    const header = document.createElement("div");
    header.className = "filter-header";
    header.innerText = filterName;

    const content = document.createElement("div");
    content.className = "filter-content";
    content.style.display = "none"; // 🔒 Start collapsed
    content.innerHTML = values.map(v => `<div>${v}</div>`).join("");

    header.onclick = () => {
      const isOpen = content.style.display === "block";

      // Collapse all
      document.querySelectorAll(".filter-content").forEach(c => (c.style.display = "none"));

      // Expand current if it was closed
      if (!isOpen) {
        content.style.display = "block";
      }
    };

    item.appendChild(header);
    item.appendChild(content);
    list.appendChild(item);
  });
}


window.addEventListener("DOMContentLoaded", createFilterAccordion);
