/**
 * StormTracker Pro GLOBAL — App Controller
 * Location jumping, scene rotation, clock, initialization
 */

// === Safe Fetch ===
async function safeFetch(url, opts = {}) {
  try {
    const h = { ...opts.headers };
    if (url.includes('weather.gov')) { h['User-Agent'] = CONFIG.nws.userAgent; h['Accept'] = 'application/geo+json'; }
    const r = await fetch(url, { ...opts, headers: h });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { console.warn('[Fetch]', url, e.message); return null; }
}

// === App ===
const App = (() => {
  let sceneIdx = 0;
  let locIdx = 0;
  let sceneTimer = null;
  let jumpTimer = null;
  let currentScene = 'radar';

  function init() {
    console.log('%c[StormTracker Pro GLOBAL] Booting...', 'color:#00d4ff;font-weight:bold;font-size:13px');

    // Branding
    setText('brand-title', CONFIG.branding.stationName + ' ' + CONFIG.branding.callSign);
    setText('brand-sub', CONFIG.branding.tagline);

    if (CONFIG.obs.transparentBg) document.body.classList.add('transparent-mode');

    // Clock
    updateClock();
    setInterval(updateClock, CONFIG.intervals.clock);

    // Init location
    updateLocationDisplay();

    // Boot modules
    tryInit('RadarMap', RadarMap);
    tryInit('Satellite', Satellite);
    tryInit('Weather', Weather);
    tryInit('AlertSystem', AlertSystem);
    tryInit('Ticker', Ticker);
    tryInit('Cameras', Cameras);

    // Activate first scene
    activateScene('radar');

    // Scene rotation
    sceneTimer = setInterval(nextScene, CONFIG.intervals.sceneRotation);

    // Location jumping
    jumpTimer = setInterval(jumpLocation, CONFIG.intervals.locationJump);

    // Build basin chips
    buildBasinChips();

    console.log('%c[StormTracker Pro GLOBAL] All systems online 🌀🌍', 'color:#00d4ff;font-weight:bold;font-size:14px');
  }

  function tryInit(name, mod) {
    try { mod.init(); console.log(`%c[${name}] ✓`, 'color:#22c55e'); }
    catch (e) { console.error(`[${name}]`, e); }
  }

  // === Clock ===
  function updateClock() {
    const now = new Date();
    setText('clk-time', now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
    setText('clk-date', now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
  }

  // === Location Jumping ===
  function jumpLocation() {
    locIdx = (locIdx + 1) % CONFIG.locations.length;

    // If there are active storms, prioritize jumping to storm locations
    const storms = AlertSystem.getStorms ? AlertSystem.getStorms() : [];
    if (storms.length > 0 && Math.random() > 0.4) {
      // 60% chance to jump to a storm location
      const storm = storms[Math.floor(Math.random() * storms.length)];
      if (storm.lat != null && storm.lon != null) {
        jumpToStorm(storm);
        return;
      }
    }

    const loc = CONFIG.locations[locIdx];
    CONFIG.activeLocationIdx = locIdx;

    // Fly map to new location
    if (typeof RadarMap !== 'undefined') {
      RadarMap.flyTo(loc.lat, loc.lng, 6);
    }

    // Update weather for new location
    if (typeof Weather !== 'undefined') {
      Weather.fetchForLocation(loc);
    }

    // Fetch alerts for new location (if US)
    if (typeof AlertSystem !== 'undefined' && loc.state) {
      AlertSystem.fetchAlerts();
    }

    // Update satellite for basin
    const basin = CONFIG.basins.find(b => b.name.toLowerCase().includes(loc.region?.toLowerCase().split(' ')[0] || ''));
    if (basin && typeof Satellite !== 'undefined') {
      Satellite.setSatForBasin(basin.id);
    }

    updateLocationDisplay();
  }

  function jumpToStorm(storm) {
    if (typeof RadarMap !== 'undefined') {
      RadarMap.flyTo(storm.lat, storm.lon, 6);
    }

    // Update display
    setText('loc-name', `🌀 ${storm.name} · ${storm.basin}`);
    setText('jump-loc-name', `${storm.name} (${storm.maxWind || '?'} mph)`);

    // Find basin for satellite
    const basin = CONFIG.basins.find(b => b.id === storm.basinId);
    if (basin && typeof Satellite !== 'undefined') {
      Satellite.setSatForBasin(basin.id);
    }

    const pillBasin = document.getElementById('pill-basin');
    if (pillBasin) pillBasin.textContent = storm.basin.toUpperCase();
  }

  function updateLocationDisplay() {
    const loc = CONFIG.locations[CONFIG.activeLocationIdx];
    setText('loc-name', loc.name);
    setText('jump-loc-name', loc.name);

    const pillBasin = document.getElementById('pill-basin');
    if (pillBasin) pillBasin.textContent = (loc.region || 'GLOBAL').toUpperCase();
  }

  // === Scene Manager ===
  function nextScene() {
    // During severe weather or active storms, bias towards radar/satellite/globe
    if (AlertSystem.hasSevereAlerts && AlertSystem.hasSevereAlerts()) {
      const sevScenes = ['radar', 'satellite'];
      const idx = sevScenes.indexOf(currentScene);
      activateScene(sevScenes[(idx + 1) % sevScenes.length]);
      return;
    }

    sceneIdx = (sceneIdx + 1) % CONFIG.scenes.length;
    activateScene(CONFIG.scenes[sceneIdx]);
  }

  function activateScene(name) {
    document.querySelectorAll('.scene').forEach(el => { el.classList.remove('active'); });
    const target = document.getElementById(`scene-${name}`);
    if (target) {
      requestAnimationFrame(() => { target.classList.add('active'); });
    }

    currentScene = name;

    const nameEl = document.getElementById('pill-scene');
    if (nameEl) {
      const labels = { radar: 'RADAR', satellite: 'SATELLITE', globe: 'GLOBE', forecast: 'FORECAST', tropical: 'TROPICAL', cameras: 'CAMERAS' };
      nameEl.textContent = labels[name] || name.toUpperCase();
      nameEl.style.animation = 'none'; void nameEl.offsetWidth; nameEl.style.animation = 'labelSwap .3s ease';
    }

    if (name === 'satellite') Satellite.loadImage();
    if (name === 'globe') Cameras.refreshGlobe();
  }

  // === Basin Chips ===
  function buildBasinChips() {
    const container = document.getElementById('basin-chips');
    if (!container) return;
    container.innerHTML = CONFIG.basins.map(b =>
      `<div class="basin-chip">${b.emoji} ${b.name}</div>`
    ).join('');
  }

  function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

  return { init, activateScene, jumpLocation };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
