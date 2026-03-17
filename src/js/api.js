const REST_COUNTRIES_BASE_URL = 'https://restcountries.com/v3.1';
const DOG_API_BASE_URL = 'https://api.thedogapi.com/v1';

let breedCache = null;

/**
 * Normalizes a string so matching is easier
 *
 * @param {string} value - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Fetches JSON and throws an error if the request fails
 *
 * @async
 * @param {string} url - URL to fetch
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<any>} Parsed JSON data
 * @throws {Error} Throws if the request fails
 */
async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Returns dog API key from env file
 *
 * @returns {string} API key
 * @throws {Error} Throws if the key is missing
 */
function getDogApiKey() {
  const apiKey = import.meta.env.VITE_DOG_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Dog API key. Add VITE_DOG_API_KEY to your .env file in the project root.'
    );
  }

  return apiKey;
}

/**
 * Fetches country by country code
 *
 * @async
 * @param {string} countryCode - Country code
 * @returns {Promise<object>} Country data object
 */
export async function fetchCountryByCode(countryCode) {
  const url =
    `${REST_COUNTRIES_BASE_URL}/alpha/${countryCode}` +
    '?fields=name,flags,cca2,cca3,region,subregion';

  const data = await fetchJson(url);

  return Array.isArray(data) ? data[0] : data;
}

/**
 * Fetches country by name
 *
 * @async
 * @param {string} countryName - Country name
 * @returns {Promise<object>} Country data object
 */
export async function fetchCountryByName(countryName) {
  const url =
    `${REST_COUNTRIES_BASE_URL}/name/${encodeURIComponent(countryName)}` +
    '?fields=name,flags,cca2,cca3,region,subregion';

  const data = await fetchJson(url);

  return Array.isArray(data) ? data[0] : data;
}

/**
 * Fetches all dog breeds from dog API
 * Caches result so app doesnt request list repeatedly
 *
 * @async
 * @returns {Promise<Array<object>>} List of dog breeds
 */
export async function fetchDogBreeds() {
  if (breedCache) {
    return breedCache;
  }

  const apiKey = getDogApiKey();

  const data = await fetchJson(`${DOG_API_BASE_URL}/breeds`, {
    headers: {
      'x-api-key': apiKey
    }
  });

  breedCache = data;
  return breedCache;
}

/**
 * Checks to make sure breed matches selected country
 *
 * @param {object} breed - Breed object
 * @param {object} country - Country object
 * @returns {boolean} True if breed matches country
 */
function breedMatchesCountry(breed, country) {
  const countryCode = normalizeText(country.cca2);
  const countryName = normalizeText(country.name?.common);
  const officialName = normalizeText(country.name?.official);

  const breedCountryCode = normalizeText(breed.country_code);
  const breedCountryCodes = normalizeText(breed.country_codes);
  const breedOrigin = normalizeText(breed.origin);

  const codeMatch =
    breedCountryCode === countryCode ||
    breedCountryCodes.includes(countryCode);

  const nameMatch =
    breedOrigin === countryName ||
    breedOrigin.includes(countryName) ||
    breedOrigin === officialName ||
    breedOrigin.includes(officialName);

  return codeMatch || nameMatch;
}

/**
 * Gets country data and dog breeds that match
 * Uses country name as a fallback in case country code is missing or invalid
 *
 * @async
 * @param {string} countryCode - Country code
 * @param {string} [countryName=''] - Country name fallback
 * @returns {Promise<{country: object, breeds: Array<object>}>} Matched data
 */
export async function getCountryAndBreeds(countryCode, countryName = '') {
  let country;

  // Try country code first - then name - if both fail throw error
  if (countryCode && countryCode !== '-99') {
    try {
      country = await fetchCountryByCode(countryCode);
    } catch (error) {
      if (countryName) {
        country = await fetchCountryByName(countryName);
      } else {
        throw error;
      }
    }
  } else if (countryName) {
    country = await fetchCountryByName(countryName);
  } else {
    throw new Error('No valid country code or country name was provided.');
  }

  const breeds = await fetchDogBreeds();

  const matchingBreeds = breeds.filter((breed) =>
    breedMatchesCountry(breed, country)
  );

  return {
    country,
    breeds: matchingBreeds
  };
}