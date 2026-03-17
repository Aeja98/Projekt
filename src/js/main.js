//Imports info and data from other files
import '../scss/main.scss';
import { getCountryAndBreeds } from './api.js';
import { initMap } from './map.js';
import {
  renderLoadingState,
  renderBreedResults,
  renderErrorState
} from './ui.js';

/**
 * Loads then renders country and breed data
 *
 * @async
 * @param {string} countryCode - Country code
 * @param {string} countryName - Country name
 * @returns {Promise<void>}
 */
async function loadCountryBreeds(countryCode, countryName) {
  try {
    renderLoadingState(countryName);

    const { country, breeds } = await getCountryAndBreeds(countryCode, countryName);

    renderBreedResults(country, breeds);
  } catch (error) {
    console.error(error);

    renderErrorState(
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while loading data.'
    );
  }
}

/**
 * Starts the app and initializes map
 *
 * @async
 * @returns {Promise<void>}
 */
async function init() {

  try {
    await initMap(loadCountryBreeds);
  } catch (error) {
    console.error(error);

    renderErrorState(
      error instanceof Error
        ? error.message
        : 'Could not initialize the map.'
    );
  }
}

init();