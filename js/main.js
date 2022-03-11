import ky from 'https://cdn.skypack.dev/ky?dts';

const BASE_API_URL = "https://rickandmortyapi.com/api";

/**------------------------------Helper functions------------------------------**/
/**-------------------(Could have been a different module)---------------------**/

// Creates an image element for each API result object and returns it
const createCharacter = (character) => {
    const characterImageEl = document.createElement("img");
    characterImageEl.classList.add("character__image");
    characterImageEl.src = character.image;
    characterImageEl.dataset.id = character.id;

    return characterImageEl;
};

// Creates the respective character info box (tooltip)
const createCharacterTooltip = (characterData, characterToolTip) => {
    characterToolTip.querySelector(
        ".info__title"
    ).textContent = `${characterData.name} - ${characterData.origin.name}`;

    characterToolTip.querySelector(
        ".details__species-value"
    ).textContent = `${characterData.species}`;
    characterToolTip.querySelector(
        ".details__planet-value"
    ).textContent = `${characterData.origin.name}`;
    characterToolTip.querySelector(
        ".details__status-value"
    ).textContent = `${characterData.status}`;
};

// Positions the info box (tooltip) relative to the character image element
const positionCharacterTooltip = (targetCharacterEl, characterToolTip) => {
    let coordinateX = targetCharacterEl.offsetLeft;
    let coordinateY = targetCharacterEl.offsetTop;
    let targetCharacterWidth = targetCharacterEl.offsetWidth;

    characterToolTip.style.insetBlockStart = `${coordinateY}px`;
    characterToolTip.style.insetInlineStart = `${coordinateX + targetCharacterWidth
        }px`;

    let containerRightBoundary = charactersContainerEl.getClientRects()[0].right;

    if (
        containerRightBoundary - (coordinateX + targetCharacterWidth) <
        targetCharacterWidth * 2
    ) {
        let newInlineStart = coordinateX - targetCharacterWidth * 2;
        characterToolTip.style.insetInlineStart = `${newInlineStart}px`;
    }

    characterToolTip.style.opacity = "1";
};

// Creates each search list item based on API filter results
const createSearchList = (character) => {
    const searchListItemImg = document.createElement("img");
    searchListItemImg.classList.add("list__item-image");
    searchListItemImg.src = character.image;

    const searchListItemDesc = document.createElement("span");
    searchListItemDesc.classList.add("list__item-desc");
    searchListItemDesc.textContent = `${character.name} - ${character.origin.name}`;

    const searchListItem = document.createElement("div");
    searchListItem.classList.add("list__item");
    searchListItem.appendChild(searchListItemImg);
    searchListItem.appendChild(searchListItemDesc);

    return searchListItem;
};

// Clears all search list items before retrieving and showing the next filter results
const clearSearchList = (searchListEl) => {
    const allSearchItemsEl = searchListEl.querySelectorAll(".list__item");
    allSearchItemsEl.forEach((searchItem) => {
        searchListEl.removeChild(searchItem);
    });
};

/* Generic function to fetch data based on query data object:
{ endpoint: "character", type: "single", value: id }

endpoint: ["character"|"location"|"episode"]
type: *all ["single"|"filter"|"pagination"] (*default)
value (depends on type): [id|querystring|page]
*/
const fetchData = async (queryData) => {
    let fullUrl = null;

    switch (queryData.type) {
        case "single":
            fullUrl = `${BASE_API_URL}/${queryData.endpoint}/${queryData.value}`;
            break;
        case "filter":
            fullUrl = `${BASE_API_URL}/${queryData.endpoint}?name=${queryData.value}`;
            break;
        case "pagination":
            fullUrl = `${BASE_API_URL}/${queryData.endpoint}?page=${queryData.value}`;
            break;
        default:
            fullUrl = `${BASE_API_URL}/${queryData.endpoint}`;
            break;
    }

    try {
        const response = await ky.get(fullUrl);
        const json = await response.json();

        return json;
    }
    catch (error) {
        throw new Error(error);
    }
};

/**------------------------------Main logic and events------------------------------**/

const charactersContainerEl = document.querySelector(".characters__container");

// Fetch all characters and populate page
try {
    const characterList = await fetchData({ endpoint: "character", type: "pagination", value: 1 });
    const { results } = characterList;

    results.forEach((character) => {
        charactersContainerEl.appendChild(createCharacter(character));
    });

    // For each created character, add mouse enter event listener and logic
    // When mouse enters a character image, retrieve character data by id and display tooltip
    const characterImagesEl =
        charactersContainerEl.querySelectorAll(".character__image");

    characterImagesEl.forEach((imageEl) => {
        imageEl.addEventListener("mouseenter", async (e) => {
            let characterId = e.target.dataset.id;

            try {
                const character = await fetchData({
                    endpoint: "character",
                    type: "single",
                    value: characterId,
                });

                const characterInfoEl = document.querySelector(".character__info");

                createCharacterTooltip(character, characterInfoEl);
                positionCharacterTooltip(e.target, characterInfoEl);
            }
            catch (error) {
                console.log(error);
            }
        });
    });

    // For each created character, add mouse enter leave listener and logic
    // When mouse leaves a character image, remove the tooltip for that character
    characterImagesEl.forEach((imageEl) => {
        imageEl.addEventListener("mouseleave", () => {
            document.querySelector(".character__info").style.opacity = "0";
        });
    });
}
catch (error) {
    console.log(error);
}

// Add input event and logic for search input box
// For each key press, retrieve a new filtered list of characters and display results
const searchEl = document.querySelector(".navigation__search");

searchEl.addEventListener("input", async () => {
    const searchListEl = document.querySelector(".search__list-container");
    const noResultsEl = document.querySelector(".search__list-nocontent");

    searchListEl.style.display = "flex";

    try {
        const filteredCharacters = await fetchData({
            endpoint: "character",
            type: "filter",
            value: searchEl.value,
        });

        const { results } = filteredCharacters;

        noResultsEl.style.display = "none";
        clearSearchList(searchListEl);
        results.forEach((character) => {
            searchListEl.appendChild(createSearchList(character));
        });
    }
    catch (error) {
        clearSearchList(searchListEl);
        noResultsEl.textContent = "Sorry... no results";
        noResultsEl.style.display = "flex";
    }

    // If search input box is empty, hide search results box
    if (searchEl.value === "") {
        searchListEl.style.display = "none";
    }
});

// Add blur event to search input box to hide search list on focus lost
searchEl.addEventListener("blur", () => {
    const searchListEl = document.querySelector(".search__list-container");
    searchListEl.style.display = "none";
});