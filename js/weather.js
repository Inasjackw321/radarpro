/**
 * StormTracker Pro - Weather Module
 * Current conditions + 7-day forecast from NWS API
 */
const Weather = (() => {
  let forecastUrl = null;
  let forecastHourlyUrl = null;
  let stationsUrl = null;
  let forecastData = null;

  async function init() {
    await resolveEndpoints();
    await Promise.all([fetchConditions(), fetchForecast()]);
    setInterval(() => {
      fetchConditions();
      fetchForecast();
    }, CONFIG.intervals.conditions);
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
    const stations = await safeFetch(stationsUrl);
    if (!stations?.features?.length) return;

    const stId = stations.features[0].properties.stationIdentifier;
    const obs = await safeFetch(`https://api.weather.gov/stations/${stId}/observations/latest`);
    if (!obs) return;
    displayConditions(obs.properties);
  }

  function displayConditions(p) {
    // Temperature
    const tc = p.temperature?.value;
    if (tc != null) {
      const tf = Math.round(tc * 9 / 5 + 32);
      setText('cond-temp', `${tf}°`);
    }

    // Description + icon
    const desc = p.textDescription || '--';
    setText('cond-desc', desc);
    setText('cond-icon', matchIcon(desc));
    setText('cond-location', CONFIG.location.name);

    // Feels like
    const hi = p.heatIndex?.value;
    const wc = p.windChill?.value;
    if (hi != null) setText('cond-feels', Math.round(hi * 9 / 5 + 32) + '°');
    else if (wc != null) setText('cond-feels', Math.round(wc * 9 / 5 + 32) + '°');
    else if (tc != null) setText('cond-feels', Math.round(tc * 9 / 5 + 32) + '°');

    // Humidity
    const rh = p.relativeHumidity?.value;
    if (rh != null) setText('cond-humidity', Math.round(rh) + '%');

    // Wind
    const ws = p.windSpeed?.value;
    if (ws != null) setText('cond-wind', Math.round(ws * 2.237) + ' mph');

    const wd = p.windDirection?.value;
    if (wd != null) {
      const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
      setText('cond-wind', `${Math.round(ws * 2.237)} ${dirs[Math.round(wd / 22.5) % 16]}`);
    }

    // Pressure
    const bp = p.barometricPressure?.value;
    if (bp != null) setText('cond-pressure', (bp / 100).toFixed(0) + ' mb');

    // Visibility
    const vis = p.visibility?.value;
    if (vis != null) setText('cond-vis', (vis / 1609.34).toFixed(1) + ' mi');

    // Dew point
    const dp = p.dewpoint?.value;
    if (dp != null) setText('cond-dewpoint', Math.round(dp * 9 / 5 + 32) + '°');

    // Flash animation
    document.querySelectorAll('.cond-value').forEach(el => {
      el.classList.remove('data-updated');
      void el.offsetWidth;
      el.classList.add('data-updated');
    });
  }

  async function fetchForecast() {
    if (!forecastUrl) return;
    const data = await safeFetch(forecastUrl);
    if (!data) return;
    forecastData = data.properties.periods;
    renderForecast();
  }

  function renderForecast() {
    if (!forecastData) return;
    const grid = document.getElementById('forecast-cards');
    if (!grid) return;

    const days = [];
    for (let i = 0; i < forecastData.length && days.length < 7; i++) {
      const p = forecastData[i];
      if (p.isDaytime) {
        const night = forecastData[i + 1];
        days.push({
          name: p.name,
          hi: p.temperature,
          lo: night ? night.temperature : null,
          desc: p.shortForecast,
          wind: p.windSpeed,
          windDir: p.windDirection,
          icon: matchIcon(p.shortForecast),
          today: i === 0
        });
      }
    }

    grid.innerHTML = days.map(d => `
      <div class="fcast-card ${d.today ? 'today' : ''}">
        <div class="fcast-day">${d.today ? 'Today' : d.name}</div>
        <div class="fcast-icon">${d.icon}</div>
        <div class="fcast-hi">${d.hi}°</div>
        <div class="fcast-lo">${d.lo != null ? d.lo + '°' : ''}</div>
        <div class="fcast-desc">${d.desc}</div>
        <div class="fcast-wind">💨 ${d.wind} ${d.windDir}</div>
      </div>
    `).join('');

    setText('forecast-loc', CONFIG.location.name);
  }

  function matchIcon(desc) {
    if (!desc) return '🌡️';
    const d = desc.toLowerCase();
    for (const [k, v] of Object.entries(CONFIG.conditionIcons)) {
      if (d.includes(k.toLowerCase())) return v;
    }
    if (d.includes('hurricane') || d.includes('tropical')) return '🌀';
    if (d.includes('thunder') || d.includes('storm')) return '⛈️';
    if (d.includes('rain') || d.includes('shower')) return '🌧️';
    if (d.includes('snow')) return '🌨️';
    if (d.includes('cloud') || d.includes('overcast')) return '☁️';
    if (d.includes('sun') || d.includes('clear')) return '☀️';
    if (d.includes('fog') || d.includes('mist')) return '🌫️';
    if (d.includes('wind')) return '💨';
    return '🌤️';
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return { init, fetchConditions, fetchForecast };
})();
