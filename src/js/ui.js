/**
 * Converts special characters into safe HTML text
 *
 * @param {string} value - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * Updates result while data loads
 *
 * @param {string} [countryLabel='selected country'] - Name of country being searched
 * @returns {void}
 */
export function renderLoadingState(countryLabel = 'selected country') {
  const subtitle = document.querySelector('#results-subtitle');
  const resultsContent = document.querySelector('#results-content');

  if (!subtitle || !resultsContent) return;

  subtitle.textContent = `Searching ${countryLabel}...`;

  resultsContent.innerHTML = `
    <div class="loading-state" aria-live="polite">
      <div class="paw-loader" aria-hidden="true">🐾</div>
      <p>Looking up breeds for ${escapeHtml(countryLabel)}...</p>
    </div>
  `;
}

/**
 * Error handling - renders error message in the results section
 *
 * @param {string} message
 * @returns {void}
 */
export function renderErrorState(message) {
  const subtitle = document.querySelector('#results-subtitle');
  const resultsContent = document.querySelector('#results-content');

  if (!subtitle || !resultsContent) return;

  subtitle.textContent = 'Something went wrong';

  resultsContent.innerHTML = `
    <div class="empty-state" aria-live="polite">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * Renders country info + matching breed results
 *
 * @param {object} country - Country data from REST countries
 * @param {Array<object>} breeds - Array of breeds
 * @returns {void}
 */
export function renderBreedResults(country, breeds) {
  const subtitle = document.querySelector('#results-subtitle');
  const resultsContent = document.querySelector('#results-content');

  if (!subtitle || !resultsContent) return;

  const countryName = country.name?.common ?? 'Unknown country';
  const regionText = [country.region, country.subregion].filter(Boolean).join(' • ');
  const flagUrl = country.flags?.svg || country.flags?.png || '';
  const flagAlt = country.flags?.alt || `Flag of ${countryName}`;

  subtitle.textContent = `${breeds.length} breed(s) found for ${countryName}`;

  if (breeds.length === 0) {
    resultsContent.innerHTML = `
      <section class="country-summary">
        ${flagUrl ? `<img src="${flagUrl}" alt="${escapeHtml(flagAlt)}" width="80">` : ''}
        <h3>${escapeHtml(countryName)}</h3>
        <p>${escapeHtml(regionText)}</p>
      </section>

      <div class="empty-state">
        <p>No dog breed origin data was found for this country in the current dataset.</p>
      </div>
    `;

    return;
  }

  resultsContent.innerHTML = `
    <section class="country-summary">
      ${flagUrl ? `<img src="${flagUrl}" alt="${escapeHtml(flagAlt)}" width="80">` : ''}
      <h3>${escapeHtml(countryName)}</h3>
      <p>${escapeHtml(regionText)}</p>
    </section>

    <section class="breed-list" aria-label="Dog breeds">
      ${breeds
        .map(
          (breed) => `
            <article class="breed-card">
              <h4>${escapeHtml(breed.name ?? 'Unknown breed')}</h4>
              <p>${escapeHtml(breed.temperament ?? 'No temperament listed.')}</p>
            </article>
          `
        )
        .join('')}
    </section>
  `;
}