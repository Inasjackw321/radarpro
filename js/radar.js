/**
 * StormTracker Pro GLOBAL — Radar Module
 * Leaflet map + RainViewer + NHC storm markers + basin fly-to
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
  let stormLayers = [];

  function init() {
    map = L.map('radar-map', {
      center: CONFIG.map.center,
      zoom: CONFIG.map.zoom,
      maxZoom: CONFIG.map.maxZoom,
      minZoom: CONFIG.map.minZoom,
      zoomControl: false, attributionControl: false,
      keyboard: false, dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, touchZoom: false,
      worldCopyJump: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19, noWrap: false
    }).addTo(map);

    loadFrames();
    setInterval(() => loadFrames(), CONFIG.intervals.radar);
  }

  async function loadFrames() {
    try {
      const r = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!r.ok) return;
      apiData = await r.json();
      const nf = [...(apiData.radar.past || []), ...(apiData.radar.nowcast || [])];
      if (!nf.length) return;

      const np = new Set(nf.map(f => f.path));
      Object.keys(layerCache).forEach(p => {
        if (!np.has(p)) { map.removeLayer(layerCache[p]); delete layerCache[p]; }
      });
      frames = nf;
      if (currentFrame >= frames.length) currentFrame = 0;
      if (!playing) play();
    } catch (e) { console.warn('[Radar]', e.message); }
  }

  function getLayer(frame) {
    if (layerCache[frame.path]) return layerCache[frame.path];
    const { colorScheme: cs, smoothing: sm, snow: sn } = CONFIG.radar;
    const l = L.tileLayer(
      `${apiData.host}${frame.path}/256/{z}/{x}/{y}/${cs}/${sm}_${sn}.png`,
      { tileSize: 256, opacity: 0, zIndex: frame.time }
    );
    l.addTo(map);
    layerCache[frame.path] = l;
    return l;
  }

  function play() { playing = true; step(); }
  function pause() { playing = false; if (animTimer) { clearTimeout(animTimer); animTimer = null; } }

  function step() {
    if (!playing || !frames.length) return;
    Object.values(layerCache).forEach(l => l.setOpacity(0));
    const f = frames[currentFrame];
    getLayer(f).setOpacity(CONFIG.radar.opacity);
    updateHUD(f.time);
    const last = currentFrame === frames.length - 1;
    currentFrame = (currentFrame + 1) % frames.length;
    animTimer = setTimeout(step, last ? CONFIG.radar.pauseOnLastFrame : CONFIG.radar.animationDelay);
  }

  function updateHUD(ts) {
    const d = new Date(ts * 1000);
    const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const el = document.getElementById('hud-radar-time');
    if (el) el.textContent = t;
    const bar = document.getElementById('prog-fill');
    if (bar) bar.style.width = ((currentFrame / frames.length) * 100) + '%';
    const lbl = document.getElementById('prog-lbl');
    if (lbl) lbl.textContent = `${currentFrame + 1}/${frames.length}`;
  }

  // Fly map to a location
  function flyTo(lat, lng, zoom) {
    if (!map) return;
    map.flyTo([lat, lng], zoom || CONFIG.map.zoom, { duration: 1.8, easeLinearity: 0.4 });
    const el = document.getElementById('radar-map');
    if (el) { el.classList.remove('map-flying'); void el.offsetWidth; el.classList.add('map-flying'); }
  }

  // Fly to a basin
  function flyToBasin(basinId) {
    const b = CONFIG.basins.find(x => x.id === basinId);
    if (b) flyTo(b.center[0], b.center[1], b.zoom);
  }

  // Draw alert polygons
  function drawAlertPolygons(alerts) {
    alertLayers.forEach(l => map.removeLayer(l));
    alertLayers = [];
    alerts.forEach(a => {
      const g = a.geometry;
      if (!g?.coordinates) return;
      const s = a.properties.severity;
      let c, fo;
      switch (s) { case 'Extreme': c='#dc2626';fo=.2;break; case 'Severe': c='#ea580c';fo=.15;break; case 'Moderate': c='#d97706';fo=.1;break; default: c='#ca8a04';fo=.06; }
      try { const l = L.geoJSON(g, { style: { color: c, weight: 2, opacity: .7, fillColor: c, fillOpacity: fo } }).addTo(map); alertLayers.push(l); } catch(_){}
    });
  }

  // Draw global storm markers
  function drawStorms(storms) {
    stormLayers.forEach(l => map.removeLayer(l));
    stormLayers = [];

    storms.forEach(s => {
      if (s.lat == null || s.lon == null) return;
      const cat = getCategory(s.maxWind);

      // Marker
      const m = L.marker([s.lat, s.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="position:relative;width:30px;height:30px;">
            <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${cat.color};background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;">
              <span style="font-size:14px;animation:slowSpin 3s linear infinite;display:block;">🌀</span>
            </div>
          </div>`,
          iconSize: [30, 30], iconAnchor: [15, 15]
        })
      }).addTo(map);
      stormLayers.push(m);

      // Label
      const lb = L.marker([s.lat, s.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="font-family:Inter,sans-serif;font-size:9px;font-weight:800;color:${cat.color};text-shadow:0 1px 3px rgba(0,0,0,.9);white-space:nowrap;padding:2px 5px;background:rgba(0,0,0,.6);border:1px solid ${cat.color}30;border-radius:3px;transform:translateX(-50%);">
            ${s.name} · ${s.maxWind || '?'} mph · ${s.basin || ''}
          </div>`,
          iconSize: [0, 0], iconAnchor: [0, -20]
        })
      }).addTo(map);
      stormLayers.push(lb);

      // Track line
      if (s.forecastTrack?.length > 1) {
        const line = L.polyline(s.forecastTrack, { color: cat.color, weight: 2, opacity: .5, dashArray: '6,5' }).addTo(map);
        stormLayers.push(line);
      }

      // Cone
      if (s.cone?.length > 2) {
        const cone = L.polygon(s.cone, { color: cat.color, weight: 1, opacity: .3, fillColor: cat.color, fillOpacity: .06, dashArray: '3,3' }).addTo(map);
        stormLayers.push(cone);
      }
    });
  }

  function getCategory(wind) {
    if (!wind) return CONFIG.stormCategories['TD'];
    if (wind >= 157) return CONFIG.stormCategories['C5'];
    if (wind >= 150) return CONFIG.stormCategories['STY'];
    if (wind >= 130) return CONFIG.stormCategories['C4'];
    if (wind >= 111) return CONFIG.stormCategories['C3'];
    if (wind >= 96)  return CONFIG.stormCategories['C2'];
    if (wind >= 74)  return CONFIG.stormCategories['C1'];
    if (wind >= 39)  return CONFIG.stormCategories['TS'];
    return CONFIG.stormCategories['TD'];
  }

  function getMap() { return map; }

  return { init, play, pause, loadFrames, flyTo, flyToBasin, drawAlertPolygons, drawStorms, getMap, getCategory };
})();
