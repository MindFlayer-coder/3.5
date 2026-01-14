const DATA = {
  races: {
    humain: {
      label: "Humain",
      abilityMods: {},
      size: "M",
      sizeMod: 0,
      type: "Humanoïde (humain)",
      speed: 9,
      traits: ["Bonus de don", "1 point de compétence supplémentaire par niveau"],
      senses: [],
      languages: ["commun"],
      bonusFeats: 1,
      bonusSkillPoints: 1,
    },
    nain: {
      label: "Nain",
      abilityMods: { for: 2, cha: -2 },
      size: "P",
      sizeMod: 1,
      type: "Humanoïde (nain)",
      speed: 6,
      traits: ["Stabilité", "Bonus contre les poisons"],
      senses: ["vision dans le noir 18 m"],
      languages: ["commun", "nain"],
      bonusFeats: 0,
      bonusSkillPoints: 0,
    },
    elfe: {
      label: "Elfe",
      abilityMods: { dex: 2, con: -2 },
      size: "M",
      sizeMod: 0,
      type: "Humanoïde (elfe)",
      speed: 9,
      traits: ["Immunité au sommeil", "Bonus contre les enchantements"],
      senses: ["vision dans la pénombre"],
      languages: ["commun", "elfe"],
      bonusFeats: 0,
      bonusSkillPoints: 0,
    },
  },
  classes: {
    guerrier: {
      label: "Guerrier",
      hitDie: 10,
      baseAttack: "bon",
      saves: { fort: "bon", ref: "faible", vol: "faible" },
      skillPoints: 2,
      bonusFeats: "guerrier",
      classFeatures: [],
    },
    barbare: {
      label: "Barbare",
      hitDie: 12,
      baseAttack: "bon",
      saves: { fort: "bon", ref: "faible", vol: "faible" },
      skillPoints: 4,
      bonusFeats: null,
      classFeatures: ["Rage 1/jour", "Déplacement accéléré"],
    },
    roublard: {
      label: "Roublard",
      hitDie: 6,
      baseAttack: "moyen",
      saves: { fort: "faible", ref: "bon", vol: "faible" },
      skillPoints: 8,
      bonusFeats: null,
      classFeatures: ["Attaque sournoise +1d6", "Pièges"],
    },
  },
  feats: [
    "Attaque en puissance",
    "Arme de prédilection",
    "Combat à deux armes",
    "Esquive",
    "Initiative améliorée",
    "Finesse du combat",
    "Tir à bout portant",
    "Tir de précision",
  ],
  skills: [
    { key: "escalade", label: "Escalade", ability: "for", classSkills: ["guerrier", "barbare", "roublard"] },
    { key: "saut", label: "Saut", ability: "for", classSkills: ["guerrier", "barbare", "roublard"] },
    { key: "natation", label: "Natation", ability: "for", classSkills: ["guerrier", "barbare"] },
    { key: "equilibre", label: "Équilibre", ability: "dex", classSkills: ["roublard"] },
    { key: "discretion", label: "Discrétion", ability: "dex", classSkills: ["roublard"] },
    { key: "deplacement", label: "Déplacement silencieux", ability: "dex", classSkills: ["roublard"] },
    { key: "perception", label: "Perception auditive", ability: "sag", classSkills: ["barbare", "roublard"] },
    { key: "detection", label: "Détection", ability: "sag", classSkills: ["roublard"] },
    { key: "intimidation", label: "Intimidation", ability: "cha", classSkills: ["guerrier", "barbare"] },
    { key: "diplomatie", label: "Diplomatie", ability: "cha", classSkills: ["roublard"] },
    { key: "crochetage", label: "Crochetage", ability: "dex", classSkills: ["roublard"] },
    { key: "fouille", label: "Fouille", ability: "int", classSkills: ["roublard"] },
  ],
  abilities: [
    { key: "for", label: "Force", short: "FOR" },
    { key: "dex", label: "Dextérité", short: "DEX" },
    { key: "con", label: "Constitution", short: "CON" },
    { key: "int", label: "Intelligence", short: "INT" },
    { key: "sag", label: "Sagesse", short: "SAG" },
    { key: "cha", label: "Charisme", short: "CHA" },
  ],
  fixedScores: [15, 14, 13, 12, 10, 8],
};

const form = document.querySelector("#npc-form");
const raceSelect = document.querySelector("#race");
const classSelect = document.querySelector("#class");
const allocationSelect = document.querySelector("#allocation");
const abilitiesGrid = document.querySelector("#abilities");
const statBlock = document.querySelector("#stat-block");
const exportButton = document.querySelector("#export-json");

const featsContainer = document.querySelector("#feats");
const featCount = document.querySelector("#feat-count");
const featOver = document.querySelector("#feat-over");
const featCustomInput = document.querySelector("#feat-custom");
const featCustomButton = document.querySelector("#feat-add");

const skillContainer = document.querySelector("#skills");
const skillSummary = document.querySelector("#skill-summary");

const state = {
  npcName: "",
  race: "humain",
  classKey: "guerrier",
  level: 1,
  allocation: "fixed",
  abilityScores: {},
  featsSelected: new Set(),
  customFeats: [],
  skillRanks: {},
};

const formatModifier = (value) => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}`;
};

const abilityModifier = (score) => Math.floor((score - 10) / 2);

const baseAttackBonus = (level, progression) => {
  if (progression === "bon") {
    return level;
  }
  if (progression === "moyen") {
    return Math.floor(level * 0.75);
  }
  return Math.floor(level * 0.5);
};

const saveBonus = (level, progression) => {
  if (progression === "bon") {
    return 2 + Math.floor(level / 2);
  }
  return Math.floor(level / 3);
};

const featSlotsByLevel = (level) => 1 + Math.floor((level - 1) / 3);

const fighterBonusFeats = (level) => {
  if (level < 1) {
    return 0;
  }
  return 1 + Math.floor(level / 2);
};

const totalFeatSlots = (level, race, classData) => {
  const base = featSlotsByLevel(level);
  const raceBonus = race.bonusFeats || 0;
  const classBonus = classData.bonusFeats === "guerrier" ? fighterBonusFeats(level) : 0;
  return {
    base,
    raceBonus,
    classBonus,
    total: base + raceBonus + classBonus,
  };
};

const skillPointsByLevel = (level, classData, race, intMod) => {
  const base = classData.skillPoints + intMod + (race.bonusSkillPoints || 0);
  const perLevel = Math.max(1, base);
  const firstLevel = perLevel * 4;
  const total = level === 1 ? firstLevel : firstLevel + (level - 1) * perLevel;
  return { perLevel, firstLevel, total };
};

const skillCost = (isClassSkill) => (isClassSkill ? 1 : 2);

const maxRanks = (level, isClassSkill) => (isClassSkill ? level + 3 : (level + 3) / 2);

const initSelectOptions = (select, entries) => {
  select.innerHTML = "";
  Object.entries(entries).forEach(([key, value]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = value.label;
    select.append(option);
  });
};

const setDefaultScores = () => {
  const scores = {};
  DATA.abilities.forEach((ability, index) => {
    scores[ability.key] = DATA.fixedScores[index];
  });
  state.abilityScores = scores;
};

const setDefaultSkillRanks = () => {
  const ranks = {};
  DATA.skills.forEach((skill) => {
    ranks[skill.key] = 0;
  });
  state.skillRanks = ranks;
};

const renderAbilityInputs = () => {
  abilitiesGrid.innerHTML = "";
  DATA.abilities.forEach((ability) => {
    const wrapper = document.createElement("div");
    wrapper.className = "form__row";

    const label = document.createElement("label");
    label.setAttribute("for", `ability-${ability.key}`);
    label.textContent = ability.label;

    const input = document.createElement("input");
    input.type = "number";
    input.id = `ability-${ability.key}`;
    input.min = "1";
    input.max = "30";
    input.value = state.abilityScores[ability.key];
    input.disabled = state.allocation === "fixed";
    input.addEventListener("input", (event) => {
      state.abilityScores[ability.key] = Number(event.target.value) || 0;
      renderStatBlock();
      updateSkillSummary();
    });

    wrapper.append(label, input);
    abilitiesGrid.append(wrapper);
  });
};

const renderFeats = () => {
  featsContainer.innerHTML = "";
  const feats = [...DATA.feats, ...state.customFeats];
  feats.forEach((feat) => {
    const wrapper = document.createElement("label");
    wrapper.className = "checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.featsSelected.has(feat);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.featsSelected.add(feat);
      } else {
        state.featsSelected.delete(feat);
      }
      updateFeatCount();
      renderStatBlock();
    });
    const span = document.createElement("span");
    span.textContent = feat;
    wrapper.append(checkbox, span);
    featsContainer.append(wrapper);
  });
  updateFeatCount();
};

const updateFeatCount = () => {
  const race = DATA.races[state.race];
  const classData = DATA.classes[state.classKey];
  const slots = totalFeatSlots(state.level, race, classData);
  const used = state.featsSelected.size;
  const remaining = slots.total - used;
  featCount.textContent = `${used}/${slots.total}`;
  featOver.textContent =
    remaining >= 0
      ? `Restant : ${remaining} (base ${slots.base} + race ${slots.raceBonus} + classe ${slots.classBonus})`
      : `Dépassement de ${Math.abs(remaining)} dons (base ${slots.base} + race ${slots.raceBonus} + classe ${slots.classBonus})`;
};

const renderSkills = () => {
  skillContainer.innerHTML = "";
  DATA.skills.forEach((skill) => {
    const isClassSkill = skill.classSkills.includes(state.classKey);
    const wrapper = document.createElement("div");
    wrapper.className = "skill-row";

    const label = document.createElement("label");
    label.textContent = `${skill.label} (${skill.ability.toUpperCase()})`;

    const input = document.createElement("input");
    input.type = "number";
    input.step = isClassSkill ? "1" : "0.5";
    input.min = "0";
    input.max = String(maxRanks(state.level, isClassSkill));
    input.value = state.skillRanks[skill.key];
    input.addEventListener("input", (event) => {
      state.skillRanks[skill.key] = Number(event.target.value) || 0;
      updateSkillSummary();
      renderStatBlock();
    });

    const meta = document.createElement("span");
    meta.className = "skill-meta";
    meta.textContent = isClassSkill
      ? `Compétence de classe • coût ${skillCost(true)}`
      : `Hors-classe • coût ${skillCost(false)}`;

    wrapper.append(label, input, meta);
    skillContainer.append(wrapper);
  });
  updateSkillSummary();
};

const updateSkillSummary = () => {
  const race = DATA.races[state.race];
  const classData = DATA.classes[state.classKey];
  const mods = computeAbilityMods();
  const points = skillPointsByLevel(state.level, classData, race, mods.int);
  const spent = DATA.skills.reduce((acc, skill) => {
    const isClassSkill = skill.classSkills.includes(state.classKey);
    const ranks = Number(state.skillRanks[skill.key]) || 0;
    return acc + ranks * skillCost(isClassSkill);
  }, 0);
  const remaining = points.total - spent;
  const remainingText =
    remaining >= 0 ? `Restant : ${remaining}` : `Dépassement : ${Math.abs(remaining)}`;
  skillSummary.textContent = `Points de compétence ${spent}/${points.total} • ${remainingText}`;
};

const applyRaceModifiers = (scores, raceMods) => {
  const updated = { ...scores };
  Object.entries(raceMods).forEach(([key, mod]) => {
    updated[key] = (updated[key] || 0) + mod;
  });
  return updated;
};

const calculateHitPoints = (level, hitDie, conMod) => {
  const average = Math.floor(hitDie / 2) + 1;
  return level * (average + conMod);
};

const hitDiceNotation = (level, hitDie) => `${level}d${hitDie}`;

const computeAbilityMods = () => {
  const race = DATA.races[state.race];
  const baseScores = { ...state.abilityScores };
  const finalScores = applyRaceModifiers(baseScores, race.abilityMods);
  return Object.fromEntries(
    DATA.abilities.map((ability) => [ability.key, abilityModifier(finalScores[ability.key])])
  );
};

const formattedSkills = (mods) =>
  DATA.skills
    .filter((skill) => (Number(state.skillRanks[skill.key]) || 0) > 0)
    .map((skill) => {
      const ranks = Number(state.skillRanks[skill.key]) || 0;
      const total = ranks + mods[skill.ability];
      return `${skill.label} ${formatModifier(total)}`;
    });

const renderStatBlock = () => {
  const race = DATA.races[state.race];
  const classData = DATA.classes[state.classKey];
  const baseScores = { ...state.abilityScores };
  const finalScores = applyRaceModifiers(baseScores, race.abilityMods);
  const mods = computeAbilityMods();
  const bab = baseAttackBonus(state.level, classData.baseAttack);
  const hp = calculateHitPoints(state.level, classData.hitDie, mods.con);
  const init = mods.dex;
  const fort = saveBonus(state.level, classData.saves.fort) + mods.con;
  const ref = saveBonus(state.level, classData.saves.ref) + mods.dex;
  const vol = saveBonus(state.level, classData.saves.vol) + mods.sag;
  const ac = 10 + mods.dex + race.sizeMod;
  const touch = 10 + mods.dex + race.sizeMod;
  const flatFooted = 10 + race.sizeMod;
  const grapple = bab + mods.for + race.sizeMod;
  const senses = race.senses.length ? race.senses.join(", ") : "aucun";
  const languages = race.languages.join(", ");

  const name = state.npcName?.trim() || "PNJ";
  const alignment = "Alignement au choix";
  const sizeType = `${race.type} de taille ${race.size}, ${alignment.toLowerCase()}`;
  const speed = `vitesse ${race.speed} m`;
  const featsList = [...state.featsSelected];
  const skillsList = formattedSkills(mods);

  statBlock.innerHTML = `
    <div class="stat-block__header">
      <div class="stat-block__title">${name}</div>
      <div class="stat-block__cr">FP 1</div>
    </div>
    <div class="stat-block__line">${race.label} ${classData.label} ${state.level}</div>
    <div class="stat-block__line">${sizeType}</div>
    <div class="stat-block__line"><span class="stat-block__label">Init</span> ${formatModifier(init)}</div>
    <div class="stat-block__line"><span class="stat-block__label">Sens</span> ${senses} ; Perception auditive +${mods.sag}, Détection +${mods.sag}</div>
    <div class="stat-block__line"><span class="stat-block__label">Langues</span> ${languages}</div>

    <div class="stat-block__section">
      <div class="stat-block__line"><span class="stat-block__label">CA</span> ${ac}, contact ${touch}, pris au dépourvu ${flatFooted}</div>
      <div class="stat-block__line"><span class="stat-block__label">pv</span> ${hp} (${hitDiceNotation(
        state.level,
        classData.hitDie
      )})</div>
      <div class="stat-block__line"><span class="stat-block__label">Vigueur</span> ${formatModifier(
        fort
      )}, <span class="stat-block__label">Réflexes</span> ${formatModifier(
        ref
      )}, <span class="stat-block__label">Volonté</span> ${formatModifier(vol)}</div>
    </div>

    <div class="stat-block__section">
      <div class="stat-block__line"><span class="stat-block__label">Vitesse</span> ${speed}</div>
      <div class="stat-block__line"><span class="stat-block__label">Mêlée</span> attaque à définir</div>
      <div class="stat-block__line"><span class="stat-block__label">À distance</span> attaque à définir</div>
      <div class="stat-block__line"><span class="stat-block__label">BBA</span> +${bab}; <span class="stat-block__label">Lutte</span> ${formatModifier(
        grapple
      )}</div>
      <div class="stat-block__line"><span class="stat-block__label">Options d'attaque</span> ${
        featsList.length ? featsList.join(" ; ") : "aucune"
      }</div>
      <div class="stat-block__line"><span class="stat-block__label">Actions spéciales</span> ${
        classData.classFeatures.length ? classData.classFeatures.join(" ; ") : "aucune"
      }</div>
    </div>

    <div class="stat-block__section">
      <div class="stat-block__line"><span class="stat-block__label">Carac.</span> ${DATA.abilities
        .map(
          (ability) =>
            `${ability.short} ${finalScores[ability.key]} (${formatModifier(mods[ability.key])})`
        )
        .join(", ")}</div>
      <div class="stat-block__line"><span class="stat-block__label">SQ</span> ${race.traits.join(
        " ; "
      )}</div>
      <div class="stat-block__line"><span class="stat-block__label">Dons</span> ${
        featsList.length ? featsList.join(" ; ") : "aucun"
      }</div>
      <div class="stat-block__line"><span class="stat-block__label">Compétences</span> ${
        skillsList.length ? skillsList.join(" ; ") : "aucune"
      }</div>
      <div class="stat-block__line"><span class="stat-block__label">Possessions</span> à définir</div>
    </div>
  `;
};

const updateStateFromForm = () => {
  state.npcName = document.querySelector("#npc-name").value;
  state.race = raceSelect.value;
  state.classKey = classSelect.value;
  state.level = Number(document.querySelector("#level").value) || 1;
  state.allocation = allocationSelect.value;
  if (state.allocation === "fixed") {
    setDefaultScores();
  }
};

const exportToJson = () => {
  const race = DATA.races[state.race];
  const classData = DATA.classes[state.classKey];
  const payload = {
    npcName: state.npcName || "PNJ",
    race: state.race,
    classKey: state.classKey,
    level: state.level,
    allocation: state.allocation,
    abilityScores: state.abilityScores,
    featsSelected: [...state.featsSelected],
    customFeats: state.customFeats,
    skillRanks: state.skillRanks,
    metadata: {
      raceLabel: race.label,
      classLabel: classData.label,
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${payload.npcName.replace(/\s+/g, "_")}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

initSelectOptions(raceSelect, DATA.races);
initSelectOptions(classSelect, DATA.classes);
setDefaultScores();
setDefaultSkillRanks();
renderAbilityInputs();
renderFeats();
renderSkills();
renderStatBlock();

allocationSelect.addEventListener("change", () => {
  state.allocation = allocationSelect.value;
  if (state.allocation === "fixed") {
    setDefaultScores();
  }
  renderAbilityInputs();
  renderSkills();
  renderFeats();
  renderStatBlock();
});

form.addEventListener("input", () => {
  updateStateFromForm();
  renderAbilityInputs();
  renderSkills();
  renderFeats();
  renderStatBlock();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateStateFromForm();
  renderStatBlock();
});

exportButton.addEventListener("click", exportToJson);

featCustomButton.addEventListener("click", () => {
  const value = featCustomInput.value.trim();
  if (!value) {
    return;
  }
  if (!state.customFeats.includes(value) && !DATA.feats.includes(value)) {
    state.customFeats.push(value);
  }
  featCustomInput.value = "";
  renderFeats();
  renderStatBlock();
});
