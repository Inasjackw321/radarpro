/**
 * StormTracker Pro GLOBAL — Weather Module
 * Open-Meteo for global conditions (any lat/lng, no API key)
 * NWS for US forecast (when in US)
 */
const Weather = (() => {
  let forecastUrl = null;
  let forecastData = null;
  let currentLoc = null;

  function init() {
    fetchForLocation(CONFIG.locations[CONFIG.activeLocationIdx]);
  }

  async function fetchForLocation(loc) {
    if (!loc) return;
    currentLoc = loc;
    setText('cond-loc', loc.name);

    // Always use Open-Meteo for current conditions (works globally)
    await fetchOpenMeteo(loc.lat, loc.lng);

    // Use NWS for forecast if in US
    if (loc.state) {
      await fetchNWSForecast(loc.lat, loc.lng);
    } else {
      await fetchOpenMeteoForecast(loc.lat, loc.lng);
    }
  }

  // === Open-Meteo (Global, no key) ===
  async function fetchOpenMeteo(lat, lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,dew_point_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const data = await safeFetch(url);
    if (!data?.current) return;

    const c = data.current;
    setText('cond-temp', Math.round(c.temperature_2m) + '°');
    setText('cond-emoji', wmoIcon(c.weather_code));
    setText('cond-desc', wmoDesc(c.weather_code));
    setText('cg-hum', Math.round(c.relative_humidity_2m) + '%');
    setText('cg-wind', `${Math.round(c.wind_speed_10m)} mph ${degToDir(c.wind_direction_10m)}`);
    setText('cg-pres', (c.surface_pressure).toFixed(0) + ' mb');
    setText('cg-dew', Math.round(c.dew_point_2m) + '°');

    document.querySelectorAll('.cg-v').forEach(el => {
      el.classList.remove('data-updated'); void el.offsetWidth; el.classList.add('data-updated');
    });
  }

  // === Open-Meteo 7-day forecast (Global) ===
  async function fetchOpenMeteoForecast(lat, lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const data = await safeFetch(url);
    if (!data?.daily) return;

    const d = data.daily;
    const days = d.time.slice(0, 7).map((t, i) => ({
      name: new Date(t + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' }),
      hi: Math.round(d.temperature_2m_max[i]),
      lo: Math.round(d.temperature_2m_min[i]),
      icon: wmoIcon(d.weather_code[i]),
      desc: wmoDesc(d.weather_code[i]),
      wind: Math.round(d.wind_speed_10m_max[i]) + ' mph',
      today: i === 0
    }));

    renderForecastCards(days);
  }

  // === NWS Forecast (US only) ===
  async function fetchNWSForecast(lat, lng) {
    const pts = await safeFetch(`https://api.weather.gov/points/${lat},${lng}`);
    if (!pts?.properties?.forecast) {
      await fetchOpenMeteoForecast(lat, lng);
      return;
    }
    forecastUrl = pts.properties.forecast;
    const data = await safeFetch(forecastUrl);
    if (!data?.properties?.periods) return;
    forecastData = data.properties.periods;

    const days = [];
    for (let i = 0; i < forecastData.length && days.length < 7; i++) {
      const p = forecastData[i];
      if (p.isDaytime) {
        const n = forecastData[i + 1];
        days.push({
          name: days.length === 0 ? 'Today' : p.name,
          hi: p.temperature,
          lo: n ? n.temperature : null,
          icon: matchIcon(p.shortForecast),
          desc: p.shortForecast,
          wind: p.windSpeed,
          today: days.length === 0
        });
      }
    }
    renderForecastCards(days);
  }

  function renderForecastCards(days) {
    const grid = document.getElementById('fcast-cards');
    if (!grid) return;
    grid.innerHTML = days.map(d => `
      <div class="fc ${d.today ? 'today' : ''}">
        <div class="fc-day">${d.name}</div>
        <div class="fc-ic">${d.icon}</div>
        <div class="fc-hi">${d.hi}°</div>
        <div class="fc-lo">${d.lo != null ? d.lo + '°' : ''}</div>
        <div class="fc-desc">${d.desc}</div>
      </div>
    `).join('');
    setText('fcast-loc', currentLoc?.name || '');
  }

  // WMO weather code to icon
  function wmoIcon(code) {
    if (code == null) return '🌤️';
    if (code <= 1) return '☀️'; if (code <= 3) return '⛅';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 57) return '🌦️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '🌨️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  }

  function wmoDesc(code) {
    if (code == null) return '--';
    const map = {
      0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
      61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 66: 'Freezing Rain', 67: 'Heavy Freezing Rain',
      71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
      80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
      85: 'Snow Showers', 86: 'Heavy Snow Showers',
      95: 'Thunderstorms', 96: 'Thunderstorm w/ Hail', 99: 'Severe Thunderstorm'
    };
    return map[code] || 'Partly Cloudy';
  }

  function matchIcon(desc) {
    if (!desc) return '🌤️';
    const d = desc.toLowerCase();
    for (const [k, v] of Object.entries(CONFIG.conditionIcons)) {
      if (d.includes(k.toLowerCase())) return v;
    }
    if (d.includes('thunder') || d.includes('storm')) return '⛈️';
    if (d.includes('rain') || d.includes('shower')) return '🌧️';
    if (d.includes('snow')) return '🌨️';
    if (d.includes('cloud')) return '☁️';
    if (d.includes('sun') || d.includes('clear')) return '☀️';
    if (d.includes('fog')) return '🌫️';
    return '🌤️';
  }

  function degToDir(deg) {
    if (deg == null) return '';
    const d = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return d[Math.round(deg / 22.5) % 16];
  }

  function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  return { init, fetchForLocation };
})();
