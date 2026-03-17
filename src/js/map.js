import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Style map stuff
const defaultStyle = {
  color: '#8b6f47',
  weight: 0.5,
  fillColor: '#f2eade',
  fillOpacity: 0.7
};

const hoverStyle = {
  color: '#6f5736',
  weight: 1,
  fillColor: '#dccbb6',
  fillOpacity: 0.9
};

const selectedStyle = {
  color: '#33251c',
  weight: 1,
  fillColor: '#bca68a',
  fillOpacity: 0.9
};

/**
 * Gets the best available country code from GeoJSON feat
 *
 * @param {object} properties - GeoJSON feature prop
 * @returns {string} Country code
 */
function getCountryCode(properties = {}) {
  const isoA2 =
    properties.ISO_A2 ||
    properties.iso_a2 ||
    properties['ISO3166-1-Alpha-2'] ||
    properties.CCA2 ||
    properties.cca2 ||
    '';

  const isoA3 =
    properties.ISO_A3 ||
    properties.iso_a3 ||
    properties.ADM0_A3 ||
    properties.adm0_a3 ||
    properties.CCA3 ||
    properties.cca3 ||
    '';

  if (isoA2 && isoA2 !== '-99') {
    return isoA2;
  }

  if (isoA3 && isoA3 !== '-99') {
    return isoA3;
  }

  return '';
}

/**
 * Gets the best country name from GeoJSON feat
 *
 * @param {object} properties
 * @returns {string} Country name
 */
function getCountryName(properties = {}) {
  return (
    properties.ADMIN ||
    properties.NAME ||
    properties.name ||
    properties.NAME_EN ||
    properties.name_en ||
    'Unknown country'
  );
}

/**
 * Loads the map data from GeoJSON data
 *
 * @async
 * @returns {Promise<object>} GeoJSON data
 */
async function fetchWorldGeoJson() {
  const response = await fetch('/data/world.geojson');

  // Error msg in case somehtin goes wrong
  if (!response.ok) {
    throw new Error('Could not load map data.');
  }

  return response.json();
}

/**
 * Initializes map + country interactions
 *
 * @async
 * @param {(countryCode: string, countryName: string) => Promise<void>} onCountrySelect - Callback when country is clicked
 * @returns {Promise<L.Map | null>} Leaflet map instance
 */
export async function initMap(onCountrySelect) {
  const mapElement = document.querySelector('#map');

  if (!mapElement || typeof onCountrySelect !== 'function') {
    return null;
  }

  const map = L.map(mapElement, {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6
  });

  // Adds visible map tiles underneath
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const geoJsonData = await fetchWorldGeoJson();

  // Keeps track of selected country
  let selectedLayer = null;

  const geoJsonLayer = L.geoJSON(geoJsonData, {
    style: () => defaultStyle,

    onEachFeature(feature, layer) {
      const properties = feature.properties || {};
      const countryCode = getCountryCode(properties);
      const countryName = getCountryName(properties);

      // Show country name on hover
      layer.bindTooltip(countryName, {
        sticky: true
      });

      layer.on({
        mouseover(event) {
          const currentLayer = event.target;

          if (currentLayer !== selectedLayer) {
            currentLayer.setStyle(hoverStyle);
          }
        },

        mouseout(event) {
          const currentLayer = event.target;

          if (currentLayer !== selectedLayer) {
            geoJsonLayer.resetStyle(currentLayer);
          }
        },

        // On click select country and apply styling
        async click(event) {
          const currentLayer = event.target;

          if (selectedLayer) {
            geoJsonLayer.resetStyle(selectedLayer);
          }

          selectedLayer = currentLayer;
          selectedLayer.setStyle(selectedStyle);

          await onCountrySelect(countryCode, countryName);
        }
      });
    }
  }).addTo(map);

  map.fitBounds(geoJsonLayer.getBounds());

  return map;
}