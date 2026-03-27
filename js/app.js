/**
 * RadarPro - App Controller
 * Main initialization, clock, scene manager, utility functions
 */

// === Shared Utility: Safe Fetch with NWS User-Agent ===
async function safeFetch(url, options = {}) {
  try {
    const headers = { ...options.headers };

    // Add User-Agent for NWS API calls
    if (url.includes('weather.gov')) {
      headers['User-Agent'] = CONFIG.nws.userAgent;
      headers['Accept'] = 'application/geo+json';
    }

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      console.warn(`Fetch error ${response.status}: ${url}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn(`Fetch failed: ${url}`, err.message);
    return null;
  }
}

// === App Controller ===
const App = (() => {
  let currentScene = 'radar';
  let sceneIndex = 0;
  let sceneTimer = null;
  let clockTimer = null;

  function init() {
    console.log('%c[RadarPro] Initializing...', 'color:#00aaff;font-weight:bold');

    // Set branding
    setText('station-name', CONFIG.branding.stationName);
    setText('station-tagline', CONFIG.branding.tagline);
    setText('location-name', CONFIG.location.name);

    // Transparent mode
    if (CONFIG.obs.transparentBg) {
      document.body.classList.add('transparent-mode');
    }

    // Start clock
    updateClock();
    clockTimer = setInterval(updateClock, 1000);

    // Initialize modules
    initModules();
  }

  async function initModules() {
    // Radar first (most important)
    try {
      RadarMap.init();
      console.log('%c[RadarPro] Radar initialized', 'color:#10b981');
    } catch (e) {
      console.error('[RadarPro] Radar init failed:', e);
    }

    // Weather conditions
    try {
      Weather.init();
      console.log('%c[RadarPro] Weather initialized', 'color:#10b981');
    } catch (e) {
      console.error('[RadarPro] Weather init failed:', e);
    }

    // Alerts
    try {
      AlertSystem.init();
      console.log('%c[RadarPro] Alerts initialized', 'color:#10b981');
    } catch (e) {
      console.error('[RadarPro] Alerts init failed:', e);
    }

    // Ticker
    try {
      Ticker.init();
      console.log('%c[RadarPro] Ticker initialized', 'color:#10b981');
    } catch (e) {
      console.error('[RadarPro] Ticker init failed:', e);
    }

    // Cameras
    try {
      Cameras.init();
      console.log('%c[RadarPro] Cameras initialized', 'color:#10b981');
    } catch (e) {
      console.error('[RadarPro] Cameras init failed:', e);
    }

    // Start scene rotation
    startSceneRotation();

    console.log('%c[RadarPro] All systems go! 📡', 'color:#00aaff;font-weight:bold;font-size:14px');
  }

  // === Clock ===
  function updateClock() {
    const now = new Date();

    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    setText('clock-time', timeStr);
    setText('clock-date', dateStr);
  }

  // === Scene Manager ===
  function startSceneRotation() {
    sceneTimer = setInterval(() => {
      // Pause rotation during severe alerts (stay on radar)
      if (AlertSystem.hasSevereAlerts && AlertSystem.hasSevereAlerts()) {
        if (currentScene !== 'radar') {
          switchScene('radar');
        }
        return;
      }

      // Advance to next scene
      sceneIndex = (sceneIndex + 1) % CONFIG.scenes.length;
      switchScene(CONFIG.scenes[sceneIndex]);
    }, CONFIG.refreshIntervals.sceneRotation);
  }

  function switchScene(sceneName) {
    if (sceneName === currentScene) return;

    const forecastPanel = document.getElementById('forecast-overlay');
    const cameraPanel = document.getElementById('camera-panel');
    const mapContainer = document.getElementById('map-container');
    const sidebar = document.getElementById('sidebar-left');
    const sceneLabel = document.getElementById('scene-label');

    // Hide all scene panels
    if (forecastPanel) forecastPanel.classList.add('hidden');
    if (cameraPanel) cameraPanel.classList.add('hidden');

    // Show appropriate scene
    switch (sceneName) {
      case 'radar':
        if (sidebar) sidebar.style.opacity = '1';
        if (sceneLabel) sceneLabel.textContent = 'RADAR';
        break;

      case 'forecast':
        if (forecastPanel) {
          forecastPanel.classList.remove('hidden');
          forecastPanel.classList.add('fade-in');
        }
        if (sceneLabel) sceneLabel.textContent = 'FORECAST';
        break;

      case 'cameras':
        if (cameraPanel) {
          cameraPanel.classList.remove('hidden');
          cameraPanel.classList.add('fade-in');
        }
        if (sceneLabel) sceneLabel.textContent = 'CAMERAS';
        break;
    }

    currentScene = sceneName;

    // Update scene label animation
    if (sceneLabel) {
      sceneLabel.style.animation = 'none';
      void sceneLabel.offsetWidth;
      sceneLabel.style.animation = 'labelSwap 0.3s ease';
    }
  }

  // === Utility ===
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  return { init, switchScene };
})();

// === Boot ===
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
