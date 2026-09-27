const API_BASE = "https://hw4-animal-vs-backend.onrender.com";
const SEARCH_DELAY_MS = 180;

const form = document.querySelector("#compare-form");
const firstInput = document.querySelector("#first");
const secondInput = document.querySelector("#second");
const firstSuggestions = document.querySelector("#first-suggestions");
const secondSuggestions = document.querySelector("#second-suggestions");
const submitButton = document.querySelector("#submit");
const swapButton = document.querySelector("#swap");
const message = document.querySelector("#message");
const result = document.querySelector("#result");
const resultTitle = document.querySelector("#result-title");
const resultDetail = document.querySelector("#result-detail");
const cards = document.querySelector("#animal-cards");
const popularList = document.querySelector("#popular-list");
const autocompleteStates = new Map();

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server responded with an unexpected format.");
  }
  if (!response.ok) throw new Error(data.error || `HTTP Error ${response.status}`);
  return data;
}

function closeSuggestions(input, suggestions) {
  suggestions.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  const state = autocompleteStates.get(input);
  if (state) state.activeIndex = -1;
}

function showSuggestionMessage(input, suggestions, text) {
  const state = autocompleteStates.get(input);
  state.matches = [];
  state.activeIndex = -1;
  suggestions.replaceChildren();
  const status = document.createElement("li");
  status.className = "animal-suggestion-status";
  status.textContent = text;
  suggestions.append(status);
  suggestions.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function setActiveSuggestion(input, suggestions, index) {
  const state = autocompleteStates.get(input);
  if (!state || state.matches.length === 0) return;

  state.activeIndex = index;
  for (const [itemIndex, option] of Array.from(suggestions.children).entries()) {
    const isActive = itemIndex === index;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-selected", String(isActive));
  }
  input.setAttribute("aria-activedescendant", `${input.id}-option-${index}`);
}

function chooseAnimal(input, suggestions, animal) {
  input.value = animal.name;
  input.dataset.animalId = animal.id;
  closeSuggestions(input, suggestions);
  showMessage("");
}

function formatNumber(value) {
  if (value >= 1000) return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 3 }).format(value);
}

function formatMass(kg) {
  if (kg < 1) return `${formatNumber(kg * 1000)} g`;
  return `${formatNumber(kg)} kg`;
}

function renderSuggestions(input, suggestions, matches) {
  const state = autocompleteStates.get(input);
  state.matches = matches;
  state.activeIndex = -1;
  suggestions.replaceChildren();

  if (matches.length === 0) {
    showSuggestionMessage(input, suggestions, "No mass-reference animals match that search.");
    return;
  }

  for (const [index, animal] of matches.entries()) {
    const option = document.createElement("li");
    option.className = "animal-suggestion";
    option.id = `${input.id}-option-${index}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "animal-suggestion-button";
    button.addEventListener("click", () => chooseAnimal(input, suggestions, animal));

    const name = document.createElement("span");
    name.className = "animal-suggestion-name";
    name.textContent = animal.name;

    const detail = document.createElement("span");
    detail.className = "animal-suggestion-scientific";
    detail.textContent = `${animal.scientific_name} · reference mass ${formatMass(animal.mass_kg)}`;

    button.append(name, detail);
    option.append(button);
    suggestions.append(option);
  }

  suggestions.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

async function searchCatalog(input, suggestions) {
  const state = autocompleteStates.get(input);
  const query = input.value.trim();
  const requestVersion = ++state.requestVersion;
  if (!query) {
    showSuggestionMessage(input, suggestions, "Type an animal name to search the mass-reference catalog.");
    return;
  }

  try {
    const parameters = new URLSearchParams({ q: query });
    const data = await getJson(`/api/animals/search?${parameters}`);
    if (requestVersion !== state.requestVersion) return;
    renderSuggestions(input, suggestions, data.animals);
  } catch (error) {
    if (requestVersion !== state.requestVersion) return;
    showSuggestionMessage(
      input,
      suggestions,
      error instanceof TypeError ? "Could not connect to the backend." : error.message,
    );
  }
}

function scheduleSearch(input, suggestions) {
  const state = autocompleteStates.get(input);
  window.clearTimeout(state.timer);
  state.timer = window.setTimeout(() => searchCatalog(input, suggestions), SEARCH_DELAY_MS);
}

function setupAutocomplete(input, suggestions) {
  autocompleteStates.set(input, { activeIndex: -1, matches: [], requestVersion: 0, timer: null });
  input.addEventListener("focus", () => scheduleSearch(input, suggestions));
  input.addEventListener("input", () => {
    delete input.dataset.animalId;
    scheduleSearch(input, suggestions);
  });
  input.addEventListener("keydown", (event) => {
    const state = autocompleteStates.get(input);
    if (event.key === "Escape") {
      closeSuggestions(input, suggestions);
      return;
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && state.matches.length > 0) {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (state.activeIndex + direction + state.matches.length) % state.matches.length;
      setActiveSuggestion(input, suggestions, nextIndex);
      return;
    }
    if (event.key === "Enter" && state.activeIndex >= 0) {
      event.preventDefault();
      chooseAnimal(input, suggestions, state.matches[state.activeIndex]);
    }
  });
  input.closest(".animal-search-wrap").addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!input.closest(".animal-search-wrap").contains(document.activeElement)) {
        closeSuggestions(input, suggestions);
      }
    }, 0);
  });
}

function makeCard(animal) {
  const card = document.createElement("article");
  card.className = "animal-card";
  const photo = animal.taxon.photo_url;
  if (photo && photo.startsWith("https://")) {
    const img = document.createElement("img");
    img.src = photo;
    img.alt = animal.name;
    img.loading = "lazy";
    card.append(img);
  } else {
    const noPhoto = document.createElement("div");
    noPhoto.className = "no-photo";
    noPhoto.textContent = "No photo";
    card.append(noPhoto);
  }

  const body = document.createElement("div");
  body.className = "card-body";
  const title = document.createElement("h3");
  title.textContent = animal.name;
  const scientific = document.createElement("p");
  scientific.className = "scientific";
  scientific.textContent = animal.scientific_name;
  const mass = document.createElement("p");
  mass.className = "mass";
  mass.textContent = `Reference mass: ${formatMass(animal.mass_kg)}`;
  const observations = document.createElement("p");
  observations.className = "api-fact";
  observations.textContent = Number.isFinite(animal.taxon.observations_count)
    ? `${formatNumber(animal.taxon.observations_count)} observations on iNaturalist`
    : "Observations not available";
  const link = document.createElement("a");
  link.href = animal.taxon.source_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View on iNaturalist ↗";
  body.append(title, scientific, mass, observations, link);
  if (animal.taxon.photo_attribution) {
    const credit = document.createElement("small");
    credit.textContent = `Photo: ${animal.taxon.photo_attribution}`;
    body.append(credit);
  }
  card.append(body);
  return card;
}

function showResult(data) {
  const heavy = data.first.mass_kg >= data.second.mass_kg ? data.first : data.second;
  const light = heavy === data.first ? data.second : data.first;
  const count = heavy.mass_kg / light.mass_kg;
  resultTitle.textContent = `1 ${heavy.name.toLowerCase()} ≈ ${formatNumber(count)} ${light.plural}`;
  resultDetail.textContent = `${formatMass(heavy.mass_kg)} ÷ ${formatMass(light.mass_kg)} = ${formatNumber(count)}. An equivalence by mass, not strength.`;
  cards.replaceChildren(makeCard(data.first), makeCard(data.second));
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPopularComparisons(comparisons) {
  popularList.replaceChildren();
  if (comparisons.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "popular-empty";
    emptyState.textContent = "No completed matchups yet. Be the first to compare two animals.";
    popularList.append(emptyState);
    return;
  }
  for (const [index, comparison] of comparisons.entries()) {
    const item = document.createElement("li");
    item.className = "popular-item";
    const rank = document.createElement("span");
    rank.className = "popular-rank";
    rank.textContent = String(index + 1).padStart(2, "0");
    const matchup = document.createElement("span");
    matchup.className = "popular-matchup";
    matchup.textContent = `${comparison.first.name} vs ${comparison.second.name}`;
    const count = document.createElement("span");
    count.className = "popular-count";
    count.textContent = `${formatNumber(comparison.count)} ${comparison.count === 1 ? "search" : "searches"}`;
    item.append(rank, matchup, count);
    popularList.append(item);
  }
}

async function loadPopularComparisons() {
  try {
    const data = await getJson("/api/popular-comparisons?limit=5");
    renderPopularComparisons(data.comparisons);
  } catch {
    popularList.replaceChildren();
    const errorState = document.createElement("li");
    errorState.className = "popular-empty";
    errorState.textContent = "Community matchup data is unavailable right now.";
    popularList.append(errorState);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  result.hidden = true;
  const firstId = firstInput.dataset.animalId;
  const secondId = secondInput.dataset.animalId;
  if (!firstId || !secondId) {
    showMessage("Choose both animals from the mass-reference suggestions before comparing.", true);
    return;
  }
  if (firstId === secondId) {
    showMessage("Please choose two different animals for the match.", true);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Comparing masses…";
  showMessage("Loading species details from iNaturalist. This may take a few seconds.");
  try {
    const query = new URLSearchParams({ first: firstId, second: secondId });
    const data = await getJson(`/api/compare?${query}`);
    showMessage("");
    showResult(data);
    loadPopularComparisons();
  } catch (error) {
    showMessage(error instanceof TypeError ? "No connection to backend. Please try again." : error.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Compare Animals <span aria-hidden="true">↗</span>';
  }
});

swapButton.addEventListener("click", () => {
  [firstInput.value, secondInput.value] = [secondInput.value, firstInput.value];
  [firstInput.dataset.animalId, secondInput.dataset.animalId] = [secondInput.dataset.animalId, firstInput.dataset.animalId];
  result.hidden = true;
  showMessage("");
});

setupAutocomplete(firstInput, firstSuggestions);
setupAutocomplete(secondInput, secondSuggestions);
loadPopularComparisons();
