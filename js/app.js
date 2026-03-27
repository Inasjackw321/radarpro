/**
 * StormTracker Pro - App Controller
 * Initialization, clock, scene manager, utilities
 */

// === Shared Fetch Utility ===
async function safeFetch(url, opts = {}) {
  try {
    const headers = { ...opts.headers };
    if (url.includes('weather.gov')) {
      headers['User-Agent'] = CONFIG.nws.userAgent;
      headers['Accept'] = 'application/geo+json';
    }
    const r = await fetch(url, { ...opts, headers });
    if (!r.ok) { console.warn(`[Fetch] ${r.status}: ${url}`); return null; }
    return await r.json();
  } catch (e) {
    console.warn(`[Fetch] Failed: ${url}`, e.message);
    return null;
  }
}

// === App Controller ===
const App = (() => {
  const scenes = CONFIG.scenes;
  let sceneIdx = 0;
  let currentScene = scenes[0];
  let sceneTimer = null;

  function init() {
    console.log('%c[StormTracker Pro] Booting...', 'color:#00d4ff;font-weight:bold');

    // Branding
    setText('brand-name', CONFIG.branding.stationName + ' ' + CONFIG.branding.callSign);
    setText('brand-tagline', CONFIG.branding.tagline);

    // Transparent mode
    if (CONFIG.obs.transparentBg) document.body.classList.add('transparent-mode');

    // Clock
    updateClock();
    setInterval(updateClock, CONFIG.intervals.clock);

    // Init modules
    boot();
  }

  async function boot() {
    // Radar (core)
    tryInit('RadarMap', RadarMap);

    // Satellite
    tryInit('Satellite', Satellite);

    // Weather
    tryInit('Weather', Weather);

    // Alerts + NHC
    tryInit('AlertSystem', AlertSystem);

    // Ticker
    tryInit('Ticker', Ticker);

    // Cameras
    tryInit('Cameras', Cameras);

    // Activate first scene
    activateScene(scenes[0]);

    // Start rotation
    sceneTimer = setInterval(nextScene, CONFIG.intervals.sceneRotation);

    console.log('%c[StormTracker Pro] All systems online 🌀', 'color:#00d4ff;font-weight:bold;font-size:14px');
  }

  function tryInit(name, mod) {
    try {
      mod.init();
      console.log(`%c[${name}] ✓`, 'color:#22c55e');
    } catch (e) {
      console.error(`[${name}] Init failed:`, e);
    }
  }

  // === Clock ===
  function updateClock() {
    const now = new Date();
    setText('clock-time', now.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    }));
    setText('clock-date', now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    }));
  }

  // === Scene Manager ===
  function nextScene() {
    // If severe alerts or active storms, prefer radar/satellite scenes
    if (AlertSystem.hasSevereAlerts && AlertSystem.hasSevereAlerts()) {
      if (currentScene !== 'radar' && currentScene !== 'satellite') {
        // Cycle between radar and satellite during severe weather
        const severeScenes = ['radar', 'satellite'];
        const idx = severeScenes.indexOf(currentScene);
        activateScene(severeScenes[(idx + 1) % severeScenes.length]);
        return;
      }
    }

    sceneIdx = (sceneIdx + 1) % scenes.length;
    activateScene(scenes[sceneIdx]);
  }

  function activateScene(name) {
    // Deactivate all
    document.querySelectorAll('.scene').forEach(el => {
      el.classList.remove('active');
      el.classList.remove('entering');
    });

    // Activate target
    const target = document.getElementById(`scene-${name}`);
    if (target) {
      target.classList.add('entering');
      // Force reflow then activate
      void target.offsetWidth;
      target.classList.add('active');
      target.classList.remove('entering');
    }

    currentScene = name;

    // Update scene indicator
    const nameEl = document.getElementById('scene-name');
    if (nameEl) {
      const labels = {
        radar: 'RADAR', satellite: 'SATELLITE', forecast: 'FORECAST',
        tropical: 'TROPICAL', cameras: 'CAMERAS'
      };
      nameEl.textContent = labels[name] || name.toUpperCase();
      nameEl.style.animation = 'none';
      void nameEl.offsetWidth;
      nameEl.style.animation = 'labelSwap 0.3s ease';
    }

    // Refresh satellite image when switching to satellite scene
    if (name === 'satellite' && typeof Satellite !== 'undefined') {
      Satellite.loadImage();
    }
  }

  // === Utility ===
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return { init, activateScene, nextScene };
})();

// === Boot ===
document.addEventListener('DOMContentLoaded', () => App.init());
