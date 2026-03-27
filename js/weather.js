/**
 * RadarPro - Weather Module
 * Current conditions and forecast from NWS API
 */
const Weather = (() => {
  let forecastUrl = null;
  let forecastHourlyUrl = null;
  let stationsUrl = null;
  let forecastData = null;

  async function init() {
    await resolveEndpoints();
    await fetchConditions();
    await fetchForecast();
    setInterval(() => {
      fetchConditions();
      fetchForecast();
    }, CONFIG.refreshIntervals.conditions);
  }

  async function resolveEndpoints() {
    const { lat, lng } = CONFIG.location;
    const data = await safeFetch(`https://api.weather.gov/points/${lat},${lng}`);
    if (!data) return;

    forecastUrl = data.properties.forecast;
    forecastHourlyUrl = data.properties.forecastHourly;
    stationsUrl = data.properties.observationStations;
  }

  async function fetchConditions() {
    if (!stationsUrl) return;

    // Get nearest station
    const stations = await safeFetch(stationsUrl);
    if (!stations || !stations.features || stations.features.length === 0) return;

    const stationId = stations.features[0].properties.stationIdentifier;

    // Get latest observation
    const obs = await safeFetch(
      `https://api.weather.gov/stations/${stationId}/observations/latest`
    );
    if (!obs) return;

    updateConditionsDisplay(obs.properties);
  }

  function updateConditionsDisplay(props) {
    // Temperature (C to F)
    const tempC = props.temperature?.value;
    if (tempC !== null && tempC !== undefined) {
      const tempF = Math.round(tempC * 9 / 5 + 32);
      setText('current-temp', `${tempF}°`);
    }

    // Conditions text
    const desc = props.textDescription || 'N/A';
    setText('conditions-text', desc);

    // Conditions icon
    const icon = matchConditionIcon(desc);
    setText('conditions-icon', icon);

    // Feels like (heat index or wind chill)
    const heatIndex = props.heatIndex?.value;
    const windChill = props.windChill?.value;
    if (heatIndex !== null && heatIndex !== undefined) {
      setText('feels-like', Math.round(heatIndex * 9 / 5 + 32) + '°');
    } else if (windChill !== null && windChill !== undefined) {
      setText('feels-like', Math.round(windChill * 9 / 5 + 32) + '°');
    } else if (tempC !== null && tempC !== undefined) {
      setText('feels-like', Math.round(tempC * 9 / 5 + 32) + '°');
    }

    // Humidity
    const humidity = props.relativeHumidity?.value;
    if (humidity !== null && humidity !== undefined) {
      setText('humidity', Math.round(humidity) + '%');
    }

    // Wind speed (m/s to mph)
    const windMs = props.windSpeed?.value;
    if (windMs !== null && windMs !== undefined) {
      const windMph = Math.round(windMs * 2.237);
      setText('wind-speed', `${windMph} mph`);
    }

    // Wind direction (degrees to cardinal)
    const windDeg = props.windDirection?.value;
    if (windDeg !== null && windDeg !== undefined) {
      setText('wind-dir', degreesToCardinal(windDeg));
    }

    // Visibility (meters to miles)
    const visM = props.visibility?.value;
    if (visM !== null && visM !== undefined) {
      const visMi = (visM / 1609.34).toFixed(1);
      setText('visibility', `${visMi} mi`);
    }

    // Barometric pressure (Pa to mb)
    const pressurePa = props.barometricPressure?.value;
    if (pressurePa !== null && pressurePa !== undefined) {
      const mb = (pressurePa / 100).toFixed(0);
      setText('pressure', `${mb} mb`);
    }

    // Flash updated values
    document.querySelectorAll('.detail-value').forEach(el => {
      el.classList.remove('data-updated');
      void el.offsetWidth; // force reflow
      el.classList.add('data-updated');
    });
  }

  async function fetchForecast() {
    if (!forecastUrl) return;

    const data = await safeFetch(forecastUrl);
    if (!data) return;

    forecastData = data.properties.periods;
    updateForecastDisplay();
  }

  function updateForecastDisplay() {
    if (!forecastData) return;

    const grid = document.getElementById('forecast-grid');
    if (!grid) return;

    // Group periods into day/night pairs (up to 7 days)
    const days = [];
    for (let i = 0; i < forecastData.length && days.length < 7; i++) {
      const period = forecastData[i];
      if (period.isDaytime) {
        const nightPeriod = forecastData[i + 1];
        days.push({
          name: period.name,
          highTemp: period.temperature,
          lowTemp: nightPeriod ? nightPeriod.temperature : null,
          shortForecast: period.shortForecast,
          windSpeed: period.windSpeed,
          windDirection: period.windDirection,
          icon: matchConditionIcon(period.shortForecast),
          isToday: i === 0
        });
      }
    }

    grid.innerHTML = days.map((day, idx) => `
      <div class="forecast-card ${day.isToday ? 'today' : ''}">
        <div class="forecast-day">${day.isToday ? 'Today' : day.name}</div>
        <div class="forecast-icon">${day.icon}</div>
        <div class="forecast-temp-high">${day.highTemp}°</div>
        <div class="forecast-temp-low">${day.lowTemp !== null ? day.lowTemp + '°' : ''}</div>
        <div class="forecast-desc">${day.shortForecast}</div>
        <div class="forecast-wind">💨 ${day.windSpeed}</div>
      </div>
    `).join('');

    // Update forecast location
    const locEl = document.getElementById('forecast-location');
    if (locEl) locEl.textContent = CONFIG.location.name;
  }

  function matchConditionIcon(description) {
    if (!description) return '🌡️';
    const desc = description.toLowerCase();

    // Check config mapping first
    for (const [key, icon] of Object.entries(CONFIG.conditionIcons)) {
      if (desc.includes(key.toLowerCase())) return icon;
    }

    // Fallback matching
    if (desc.includes('thunder') || desc.includes('storm')) return '⛈️';
    if (desc.includes('snow') || desc.includes('blizzard')) return '🌨️';
    if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) return '🌧️';
    if (desc.includes('cloud') || desc.includes('overcast')) return '☁️';
    if (desc.includes('sun') || desc.includes('clear')) return '☀️';
    if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze')) return '🌫️';
    if (desc.includes('wind')) return '💨';
    if (desc.includes('ice') || desc.includes('freez')) return '🧊';

    return '🌤️';
  }

  function degreesToCardinal(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return dirs[idx];
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function getForecastData() {
    return forecastData;
  }

  return { init, fetchConditions, fetchForecast, getForecastData };
})();
