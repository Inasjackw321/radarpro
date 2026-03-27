/**
 * RadarPro - Radar Module
 * Leaflet map + RainViewer radar tile animation
 */
const RadarMap = (() => {
  let map = null;
  let frames = [];
  let layerCache = {};
  let currentFrame = 0;
  let playing = false;
  let animationTimer = null;
  let apiData = null;
  let locationMarker = null;
  let alertLayers = [];

  function init() {
    map = L.map('radar-map', {
      center: CONFIG.radarCenter,
      zoom: CONFIG.radarZoom,
      maxZoom: CONFIG.maxZoom,
      minZoom: 4,
      zoomControl: false,
      attributionControl: false,
      keyboard: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false
    });

    // Dark basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Location marker with pulse effect
    addLocationMarker();

    // Load radar frames
    loadFrames();

    // Auto-refresh
    setInterval(() => loadFrames(), CONFIG.refreshIntervals.radar);
  }

  function addLocationMarker() {
    const loc = CONFIG.location;

    // Pulsing circle marker
    const pulseIcon = L.divIcon({
      className: 'location-pin',
      html: `
        <div style="position:relative;width:20px;height:20px;">
          <div style="
            position:absolute;top:0;left:0;width:20px;height:20px;
            background:rgba(0,170,255,0.3);border-radius:50%;
            animation:mapPinPulse 2s ease-in-out infinite;
          "></div>
          <div style="
            position:absolute;top:6px;left:6px;width:8px;height:8px;
            background:#00aaff;border-radius:50%;
            border:2px solid #fff;box-shadow:0 0 10px rgba(0,170,255,0.6);
          "></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    locationMarker = L.marker(CONFIG.radarCenter, { icon: pulseIcon }).addTo(map);

    // City label
    L.marker(CONFIG.radarCenter, {
      icon: L.divIcon({
        className: 'city-label',
        html: `<div style="
          font-family:'Inter',sans-serif;font-size:11px;font-weight:600;
          color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.8),0 0 8px rgba(0,0,0,0.5);
          white-space:nowrap;padding:2px 6px;
          background:rgba(0,0,0,0.4);border-radius:4px;
          transform:translateX(-50%);
        ">${loc.name}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, -14]
      })
    }).addTo(map);
  }

  async function loadFrames() {
    try {
      const resp = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!resp.ok) return;
      apiData = await resp.json();

      const newFrames = [
        ...(apiData.radar.past || []),
        ...(apiData.radar.nowcast || [])
      ];

      if (newFrames.length === 0) return;

      // Clean up old layers not in new data
      const newPaths = new Set(newFrames.map(f => f.path));
      Object.keys(layerCache).forEach(path => {
        if (!newPaths.has(path)) {
          map.removeLayer(layerCache[path]);
          delete layerCache[path];
        }
      });

      frames = newFrames;

      // Keep current frame in bounds
      if (currentFrame >= frames.length) {
        currentFrame = 0;
      }

      if (!playing) {
        play();
      }
    } catch (err) {
      console.warn('RadarMap: Failed to load frames', err);
    }
  }

  function getLayer(frame) {
    if (layerCache[frame.path]) return layerCache[frame.path];

    const colorScheme = CONFIG.radar.colorScheme;
    const smooth = CONFIG.radar.smoothing;
    const snow = CONFIG.radar.snow;

    const layer = L.tileLayer(
      `${apiData.host}${frame.path}/256/{z}/{x}/{y}/${colorScheme}/${smooth}_${snow}.png`,
      {
        tileSize: 256,
        opacity: 0,
        zIndex: frame.time
      }
    );

    layer.addTo(map);
    layerCache[frame.path] = layer;
    return layer;
  }

  function play() {
    playing = true;
    animateFrame();
  }

  function pause() {
    playing = false;
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  function animateFrame() {
    if (!playing || frames.length === 0) return;

    // Hide all layers
    Object.values(layerCache).forEach(layer => {
      layer.setOpacity(0);
    });

    // Show current frame
    const frame = frames[currentFrame];
    const layer = getLayer(frame);
    layer.setOpacity(CONFIG.radar.opacity);

    // Update UI
    updateTimestamp(frame.time);
    updateProgress();

    // Determine delay
    const isLastFrame = currentFrame === frames.length - 1;
    const delay = isLastFrame ? CONFIG.radar.pauseOnLastFrame : CONFIG.radar.animationDelay;

    // Advance
    currentFrame = (currentFrame + 1) % frames.length;

    animationTimer = setTimeout(() => animateFrame(), delay);
  }

  function updateTimestamp(unixTime) {
    const date = new Date(unixTime * 1000);
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const el = document.getElementById('radar-timestamp');
    if (el) el.textContent = timeStr;

    const info = document.getElementById('radar-frame-info');
    if (info) {
      const isPast = unixTime <= (Date.now() / 1000);
      info.textContent = isPast ? 'Past' : 'Forecast';
    }
  }

  function updateProgress() {
    const bar = document.getElementById('radar-progress-bar');
    if (bar && frames.length > 0) {
      const pct = ((currentFrame) / frames.length) * 100;
      bar.style.width = pct + '%';
    }
  }

  // Draw NWS alert polygons on the map
  function drawAlertPolygons(alerts) {
    // Clear old alert layers
    alertLayers.forEach(layer => map.removeLayer(layer));
    alertLayers = [];

    alerts.forEach(alert => {
      const geom = alert.geometry;
      if (!geom || !geom.coordinates) return;

      const severity = alert.properties.severity;
      let color, fillOpacity;

      switch (severity) {
        case 'Extreme':
          color = '#dc2626'; fillOpacity = 0.2; break;
        case 'Severe':
          color = '#ea580c'; fillOpacity = 0.15; break;
        case 'Moderate':
          color = '#d97706'; fillOpacity = 0.1; break;
        default:
          color = '#ca8a04'; fillOpacity = 0.08;
      }

      try {
        const geoJsonLayer = L.geoJSON(geom, {
          style: {
            color: color,
            weight: 2,
            opacity: 0.7,
            fillColor: color,
            fillOpacity: fillOpacity
          }
        }).addTo(map);

        alertLayers.push(geoJsonLayer);
      } catch (e) {
        // Invalid geometry, skip
      }
    });
  }

  function getMap() {
    return map;
  }

  return { init, play, pause, loadFrames, drawAlertPolygons, getMap };
})();
