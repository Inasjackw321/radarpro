/**
 * StormTracker Pro GLOBAL — Alerts Module
 * NWS alerts + NHC CurrentStorms.json for ALL active storms worldwide
 */
const AlertSystem = (() => {
  let activeAlerts = [];
  let activeStorms = [];
  let bannerIdx = 0;
  let lastAlertHash = '';

  async function init() {
    await Promise.all([fetchAlerts(), fetchGlobalStorms()]);
    setInterval(fetchAlerts, CONFIG.intervals.alerts);
    setInterval(fetchGlobalStorms, CONFIG.intervals.nhc);
    setInterval(rotateBanner, 6000);
  }

  // === NWS ALERTS (US) ===
  async function fetchAlerts() {
    const loc = CONFIG.locations[CONFIG.activeLocationIdx];
    if (!loc?.state) { clearAlerts(); return; }

    const data = await safeFetch(`https://api.weather.gov/alerts/active?area=${loc.state}`);
    if (!data?.features) return;

    const now = new Date();
    const seen = new Set();
    activeAlerts = data.features
      .filter(f => new Date(f.properties.expires) > now)
      .filter(f => { const k = f.properties.event + f.properties.areaDesc; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => {
        const o = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
        return (o[a.properties.severity] ?? 4) - (o[b.properties.severity] ?? 4);
      });

    const h = activeAlerts.map(a => a.properties.id).join(',');
    if (h === lastAlertHash) return;
    lastAlertHash = h;

    updateAlertUI();
    updateTicker();
    if (typeof RadarMap !== 'undefined') RadarMap.drawAlertPolygons(activeAlerts);
  }

  function clearAlerts() {
    activeAlerts = [];
    lastAlertHash = '';
    updateAlertUI();
  }

  function updateAlertUI() {
    const ct = document.getElementById('alert-ct');
    if (ct) { ct.textContent = activeAlerts.length; ct.classList.toggle('active', activeAlerts.length > 0); }

    const list = document.getElementById('alert-list');
    if (list) {
      if (!activeAlerts.length) {
        list.innerHTML = '<div class="sb-empty">No active alerts</div>';
      } else {
        list.innerHTML = activeAlerts.slice(0, 5).map(a => {
          const p = a.properties;
          return `<div class="al-item sev-${p.severity}"><strong>${p.event}</strong><br><span style="font-size:8px;opacity:.6">${trunc(p.areaDesc, 45)}</span></div>`;
        }).join('');
      }
    }

    bannerIdx = 0;
    showBanner();
  }

  function showBanner() {
    const ribbon = document.getElementById('alert-ribbon');
    if (!ribbon) return;

    const severe = activeAlerts.filter(a => ['Extreme', 'Severe'].includes(a.properties.severity));
    const hurricane = activeAlerts.filter(a => {
      const e = a.properties.event.toLowerCase();
      return e.includes('hurricane') || e.includes('typhoon') || e.includes('tropical') || e.includes('storm surge');
    });
    const show = [...new Set([...severe, ...hurricane])];

    if (!show.length) { ribbon.classList.add('hidden'); return; }

    const al = show[bannerIdx % show.length];
    const p = al.properties;
    ribbon.className = `alert-ribbon ${CONFIG.alertColors[p.severity]?.class || 'alert-unknown'}`;
    ribbon.setAttribute('data-event', p.event);
    ribbon.classList.remove('hidden');

    setText('ribbon-badge', p.severity.toUpperCase());
    setText('ribbon-event', p.event);
    setText('ribbon-detail', p.headline || p.areaDesc || '');
    setText('ribbon-count', show.length > 1 ? `${(bannerIdx % show.length) + 1}/${show.length}` : '');
  }

  function rotateBanner() { bannerIdx++; showBanner(); }

  // === GLOBAL STORMS (NHC CurrentStorms.json + ArcGIS) ===
  async function fetchGlobalStorms() {
    const storms = [];

    // NHC CurrentStorms.json — free, no key, Atlantic + East Pacific
    try {
      const data = await safeFetch(CONFIG.nhc.currentStormsUrl);
      if (data?.activeStorms) {
        data.activeStorms.forEach(s => {
          storms.push({
            id: s.id,
            name: s.name || 'Unknown',
            classification: s.classification || '',
            maxWind: s.intensity ? parseInt(s.intensity) : null,
            pressure: s.pressure ? parseInt(s.pressure) : null,
            lat: s.latitude ? parseFloat(s.latitude) : null,
            lon: s.longitude ? parseFloat(s.longitude) : null,
            movement: s.movementDir ? `${s.movementDir} at ${s.movementSpeed || '?'} mph` : '',
            basin: s.binNumber?.startsWith('at') ? 'Atlantic'
                 : s.binNumber?.startsWith('ep') ? 'E. Pacific'
                 : s.binNumber?.startsWith('cp') ? 'C. Pacific' : 'Unknown',
            basinId: s.binNumber?.startsWith('at') ? 'AL'
                   : s.binNumber?.startsWith('ep') ? 'EP'
                   : s.binNumber?.startsWith('cp') ? 'CP' : 'AL',
            forecastTrack: [],
            cone: []
          });
        });
      }
    } catch (e) { console.warn('[NHC CurrentStorms]', e.message); }

    // Also try ArcGIS for additional data (forecast tracks, cone)
    try {
      const url = `${CONFIG.nhc.gisService}/NHC_Atl_trop_cyclones_active/MapServer/0/query?where=1%3D1&outFields=*&f=json`;
      const data = await safeFetch(url);
      if (data?.features) {
        data.features.forEach(f => {
          const a = f.attributes;
          const g = f.geometry;
          const name = a.STORMNAME || a.NAME;
          if (!name) return;

          // Update existing or add
          let existing = storms.find(s => s.name.toUpperCase() === name.toUpperCase());
          if (!existing) {
            storms.push({
              id: name, name, classification: a.STORMTYPE || '',
              maxWind: a.MAXWIND || 0, pressure: a.MINPRESSURE || 0,
              lat: g?.y, lon: g?.x,
              movement: '', basin: 'Atlantic', basinId: 'AL',
              forecastTrack: [], cone: []
            });
          } else if (g) {
            existing.lat = existing.lat || g.y;
            existing.lon = existing.lon || g.x;
          }
        });
      }
    } catch (_) {}

    // Try East Pacific ArcGIS
    try {
      const url = `${CONFIG.nhc.gisService}/NHC_E_Pac_trop_cyclones_active/MapServer/0/query?where=1%3D1&outFields=*&f=json`;
      const data = await safeFetch(url);
      if (data?.features) {
        data.features.forEach(f => {
          const a = f.attributes;
          const g = f.geometry;
          const name = a.STORMNAME || a.NAME;
          if (!name) return;
          let existing = storms.find(s => s.name.toUpperCase() === name.toUpperCase());
          if (!existing) {
            storms.push({
              id: name, name, classification: a.STORMTYPE || '',
              maxWind: a.MAXWIND || 0, pressure: a.MINPRESSURE || 0,
              lat: g?.y, lon: g?.x,
              movement: '', basin: 'E. Pacific', basinId: 'EP',
              forecastTrack: [], cone: []
            });
          }
        });
      }
    } catch (_) {}

    activeStorms = storms;
    updateStormUI();
    if (typeof RadarMap !== 'undefined') RadarMap.drawStorms(storms);
  }

  function updateStormUI() {
    const badge = document.getElementById('storm-badge');
    if (badge) { badge.textContent = activeStorms.length; badge.classList.toggle('active', activeStorms.length > 0); }

    const list = document.getElementById('storm-list');
    if (!list) return;

    if (!activeStorms.length) {
      list.innerHTML = '<div class="sb-empty">No active systems worldwide</div>';
    } else {
      list.innerHTML = activeStorms.map(s => {
        const cat = RadarMap.getCategory(s.maxWind);
        return `<div class="storm-row">
          <div class="storm-dot" style="color:${cat.color};background:${cat.color}"></div>
          <div style="flex:1;min-width:0">
            <div class="storm-nm">${s.name}</div>
            <div class="storm-cat">${cat.label}</div>
          </div>
          <div style="text-align:right">
            <div class="storm-w">${s.maxWind || '?'} mph</div>
            <div class="storm-basin-tag">${s.basin}</div>
          </div>
        </div>`;
      }).join('');
    }

    // Update basin chips
    updateBasinChips();

    // Send to ticker
    if (typeof Ticker !== 'undefined' && Ticker.setStorms) Ticker.setStorms(activeStorms);
  }

  function updateBasinChips() {
    const container = document.getElementById('basin-chips');
    if (!container) return;
    const stormBasins = new Set(activeStorms.map(s => s.basinId));
    container.innerHTML = CONFIG.basins.map(b => {
      const hasStorms = stormBasins.has(b.id);
      return `<div class="basin-chip ${hasStorms ? 'has-storms' : ''}">${b.emoji} ${b.name}</div>`;
    }).join('');
  }

  function updateTicker() {
    if (typeof Ticker !== 'undefined' && Ticker.setAlerts) {
      Ticker.setAlerts(activeAlerts.map(a => ({
        text: `${a.properties.event}: ${a.properties.headline || a.properties.areaDesc}`,
        severity: a.properties.severity,
        event: a.properties.event
      })));
    }
  }

  function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
  function trunc(s, n) { return s && s.length > n ? s.substring(0, n) + '...' : (s || ''); }

  function getAlerts() { return activeAlerts; }
  function getStorms() { return activeStorms; }
  function hasSevereAlerts() { return activeAlerts.some(a => ['Extreme', 'Severe'].includes(a.properties.severity)); }
  function hasActiveStorms() { return activeStorms.length > 0; }

  return { init, fetchAlerts, fetchGlobalStorms, getAlerts, getStorms, hasSevereAlerts, hasActiveStorms };
})();
