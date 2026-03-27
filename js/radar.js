/**
 * StormTracker Pro - Radar Module
 * Leaflet map + RainViewer animation + NHC hurricane tracks on map
 */
const RadarMap = (() => {
  let map = null;
  let frames = [];
  let layerCache = {};
  let currentFrame = 0;
  let playing = false;
  let animTimer = null;
  let apiData = null;
  let alertLayers = [];
  let nhcLayers = [];

  function init() {
    map = L.map('radar-map', {
      center: CONFIG.map.center,
      zoom: CONFIG.map.zoom,
      maxZoom: CONFIG.map.maxZoom,
      minZoom: CONFIG.map.minZoom,
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
      subdomains: 'abcd', maxZoom: 19
    }).addTo(map);

    addLocationMarker();
    loadFrames();
    setInterval(() => loadFrames(), CONFIG.intervals.radar);
  }

  function addLocationMarker() {
    const { lat, lng, name } = CONFIG.location;

    // Pulse marker
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="position:relative;width:22px;height:22px;">
          <div style="position:absolute;inset:0;background:rgba(0,212,255,0.25);border-radius:50%;animation:pinRing 2s ease-in-out infinite;"></div>
          <div style="position:absolute;top:7px;left:7px;width:8px;height:8px;background:#00d4ff;border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px rgba(0,212,255,0.5);"></div>
        </div>`,
        iconSize: [22, 22], iconAnchor: [11, 11]
      })
    }).addTo(map);

    // Label
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.9);white-space:nowrap;padding:2px 6px;background:rgba(0,0,0,0.5);border-radius:4px;transform:translateX(-50%);">${name}</div>`,
        iconSize: [0, 0], iconAnchor: [0, -16]
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

      // Cleanup stale layers
      const newPaths = new Set(newFrames.map(f => f.path));
      Object.keys(layerCache).forEach(path => {
        if (!newPaths.has(path)) {
          map.removeLayer(layerCache[path]);
          delete layerCache[path];
        }
      });

      frames = newFrames;
      if (currentFrame >= frames.length) currentFrame = 0;
      if (!playing) play();
    } catch (e) {
      console.warn('[Radar] Load failed:', e.message);
    }
  }

  function getLayer(frame) {
    if (layerCache[frame.path]) return layerCache[frame.path];
    const { colorScheme: cs, smoothing: sm, snow: sn } = CONFIG.radar;
    const layer = L.tileLayer(
      `${apiData.host}${frame.path}/256/{z}/{x}/{y}/${cs}/${sm}_${sn}.png`,
      { tileSize: 256, opacity: 0, zIndex: frame.time }
    );
    layer.addTo(map);
    layerCache[frame.path] = layer;
    return layer;
  }

  function play() {
    playing = true;
    step();
  }

  function pause() {
    playing = false;
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }
  }

  function step() {
    if (!playing || frames.length === 0) return;

    Object.values(layerCache).forEach(l => l.setOpacity(0));
    const frame = frames[currentFrame];
    getLayer(frame).setOpacity(CONFIG.radar.opacity);

    updateHUD(frame.time);

    const isLast = currentFrame === frames.length - 1;
    currentFrame = (currentFrame + 1) % frames.length;
    animTimer = setTimeout(step, isLast ? CONFIG.radar.pauseOnLastFrame : CONFIG.radar.animationDelay);
  }

  function updateHUD(ts) {
    const d = new Date(ts * 1000);
    const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const el = document.getElementById('radar-time-hud');
    if (el) el.textContent = t;

    const bar = document.getElementById('radar-progress-fill');
    if (bar) bar.style.width = ((currentFrame / frames.length) * 100) + '%';

    const label = document.getElementById('radar-frame-label');
    if (label) label.textContent = `${currentFrame + 1} / ${frames.length}`;
  }

  // Draw NWS alert polygons
  function drawAlertPolygons(alerts) {
    alertLayers.forEach(l => map.removeLayer(l));
    alertLayers = [];

    alerts.forEach(a => {
      const geom = a.geometry;
      if (!geom || !geom.coordinates) return;
      const sev = a.properties.severity;
      let color, fo;
      switch (sev) {
        case 'Extreme': color = '#dc2626'; fo = 0.2; break;
        case 'Severe':  color = '#ea580c'; fo = 0.15; break;
        case 'Moderate': color = '#d97706'; fo = 0.1; break;
        default: color = '#ca8a04'; fo = 0.06;
      }
      try {
        const layer = L.geoJSON(geom, {
          style: { color, weight: 2, opacity: 0.7, fillColor: color, fillOpacity: fo }
        }).addTo(map);
        alertLayers.push(layer);
      } catch (_) {}
    });
  }

  // Draw NHC storm data on map
  function drawNHCData(storms) {
    nhcLayers.forEach(l => map.removeLayer(l));
    nhcLayers = [];

    storms.forEach(storm => {
      if (!storm.lat || !storm.lon) return;
      const catInfo = getCategory(storm.maxWind);

      // Storm marker
      const marker = L.marker([storm.lat, storm.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="position:relative;width:32px;height:32px;">
            <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${catInfo.color};background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;">
              <span style="font-size:16px;animation:slowSpin 4s linear infinite;display:block;">🌀</span>
            </div>
          </div>`,
          iconSize: [32, 32], iconAnchor: [16, 16]
        })
      }).addTo(map);
      nhcLayers.push(marker);

      // Storm label
      const label = L.marker([storm.lat, storm.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="font-family:Inter,sans-serif;font-size:10px;font-weight:800;color:${catInfo.color};text-shadow:0 1px 3px rgba(0,0,0,0.9);white-space:nowrap;padding:2px 6px;background:rgba(0,0,0,0.6);border:1px solid ${catInfo.color}40;border-radius:4px;transform:translateX(-50%);">
            ${storm.name} · ${storm.maxWind} mph
          </div>`,
          iconSize: [0, 0], iconAnchor: [0, -22]
        })
      }).addTo(map);
      nhcLayers.push(label);

      // Forecast track line if available
      if (storm.forecastTrack && storm.forecastTrack.length > 1) {
        const line = L.polyline(storm.forecastTrack, {
          color: catInfo.color, weight: 2, opacity: 0.6,
          dashArray: '8,6'
        }).addTo(map);
        nhcLayers.push(line);
      }

      // Cone of uncertainty if available
      if (storm.cone && storm.cone.length > 2) {
        const cone = L.polygon(storm.cone, {
          color: catInfo.color, weight: 1, opacity: 0.4,
          fillColor: catInfo.color, fillOpacity: 0.08,
          dashArray: '4,4'
        }).addTo(map);
        nhcLayers.push(cone);
      }
    });
  }

  function getCategory(windMph) {
    if (!windMph) return CONFIG.stormCategories['TD'];
    if (windMph >= 157) return CONFIG.stormCategories['C5'];
    if (windMph >= 130) return CONFIG.stormCategories['C4'];
    if (windMph >= 111) return CONFIG.stormCategories['C3'];
    if (windMph >= 96)  return CONFIG.stormCategories['C2'];
    if (windMph >= 74)  return CONFIG.stormCategories['C1'];
    if (windMph >= 39)  return CONFIG.stormCategories['TS'];
    return CONFIG.stormCategories['TD'];
  }

  function getMap() { return map; }

  return { init, play, pause, loadFrames, drawAlertPolygons, drawNHCData, getMap, getCategory };
})();
