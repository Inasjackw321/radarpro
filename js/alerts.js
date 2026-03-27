/**
 * StormTracker Pro - Alerts Module
 * NWS alerts + NHC tropical cyclone data
 */
const AlertSystem = (() => {
  let activeAlerts = [];
  let activeStorms = [];
  let bannerIdx = 0;
  let lastHash = '';

  async function init() {
    await Promise.all([fetchAlerts(), fetchNHCStorms()]);
    setInterval(fetchAlerts, CONFIG.intervals.alerts);
    setInterval(fetchNHCStorms, CONFIG.intervals.nhc);
    setInterval(rotateBanner, 7000);
  }

  // === NWS ALERTS ===
  async function fetchAlerts() {
    const data = await safeFetch(
      `https://api.weather.gov/alerts/active?area=${CONFIG.state}`
    );
    if (!data?.features) return;

    const now = new Date();
    const seen = new Set();

    activeAlerts = data.features
      .filter(f => new Date(f.properties.expires) > now)
      .filter(f => {
        const k = f.properties.event + '|' + (f.properties.areaDesc || '');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => {
        const o = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
        return (o[a.properties.severity] ?? 4) - (o[b.properties.severity] ?? 4);
      });

    const hash = activeAlerts.map(a => a.properties.id).join(',');
    if (hash === lastHash) return;
    lastHash = hash;

    updateAlertDisplay();
    updateTicker();
    drawMapPolygons();
  }

  function updateAlertDisplay() {
    // Count badge
    const countEl = document.getElementById('alert-count');
    if (countEl) {
      countEl.textContent = activeAlerts.length;
      countEl.classList.toggle('active', activeAlerts.length > 0);
    }

    // Sidebar list
    const listEl = document.getElementById('alert-list');
    if (listEl) {
      if (activeAlerts.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No active alerts</div>';
      } else {
        listEl.innerHTML = activeAlerts.slice(0, 6).map(a => {
          const p = a.properties;
          return `<div class="alert-item sev-${p.severity}">
            <strong>${p.event}</strong><br>
            <span style="font-size:9px;opacity:0.6">${truncate(p.areaDesc, 50)}</span>
          </div>`;
        }).join('');
      }
    }

    // Banner
    bannerIdx = 0;
    showBanner();
  }

  function showBanner() {
    const banner = document.getElementById('alert-banner');
    if (!banner) return;

    const severe = activeAlerts.filter(a =>
      ['Extreme', 'Severe'].includes(a.properties.severity)
    );

    // Also include hurricane-related alerts even if moderate
    const hurricaneAlerts = activeAlerts.filter(a => {
      const evt = a.properties.event.toLowerCase();
      return evt.includes('hurricane') || evt.includes('tropical') || evt.includes('storm surge');
    });

    const showAlerts = [...new Set([...severe, ...hurricaneAlerts])];

    if (showAlerts.length === 0) {
      banner.classList.add('hidden');
      return;
    }

    const alert = showAlerts[bannerIdx % showAlerts.length];
    const p = alert.properties;
    const cls = CONFIG.alertColors[p.severity]?.class || 'alert-unknown';

    banner.className = `alert-banner ${cls}`;
    banner.setAttribute('data-event', p.event);
    banner.classList.remove('hidden');

    setText('alert-severity-badge', p.severity.toUpperCase());
    setText('alert-event-text', p.event);
    setText('alert-area-text', p.headline || p.areaDesc || '');
    setText('alert-counter', showAlerts.length > 1
      ? `${(bannerIdx % showAlerts.length) + 1}/${showAlerts.length}` : '');
  }

  function rotateBanner() {
    bannerIdx++;
    showBanner();
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

  function drawMapPolygons() {
    if (typeof RadarMap !== 'undefined') RadarMap.drawAlertPolygons(activeAlerts);
  }

  // === NHC TROPICAL STORMS ===
  async function fetchNHCStorms() {
    try {
      // Use NHC ArcGIS active storms service
      const url = `${CONFIG.nhc.gisService}/NHC_Atl_trop_cyclones_active/MapServer/0/query?where=1%3D1&outFields=*&f=json`;
      const data = await safeFetch(url);

      if (data?.features?.length) {
        activeStorms = data.features.map(f => {
          const a = f.attributes;
          const g = f.geometry;
          return {
            name: a.STORMNAME || a.NAME || 'Unknown',
            type: a.STORMTYPE || '',
            maxWind: a.MAXWIND || a.INTENSITY || 0,
            pressure: a.MINPRESSURE || a.MSLP || 0,
            movement: a.MOVEMENTDIR ? `${a.MOVEMENTDIR} at ${a.MOVEMENTSPD || '?'} mph` : '',
            lat: g ? g.y : null,
            lon: g ? g.x : null,
            basin: 'Atlantic',
            forecastTrack: [],
            cone: []
          };
        });
      } else {
        activeStorms = [];
      }

      // Also try to get forecast track
      await fetchForecastTracks();

      updateStormDisplay();
      if (typeof RadarMap !== 'undefined') RadarMap.drawNHCData(activeStorms);
    } catch (e) {
      console.warn('[NHC] Fetch failed:', e.message);
    }
  }

  async function fetchForecastTracks() {
    try {
      const url = `${CONFIG.nhc.gisService}/NHC_Atl_trop_cyclones_active/MapServer/2/query?where=1%3D1&outFields=*&f=json&returnGeometry=true`;
      const data = await safeFetch(url);

      if (data?.features?.length) {
        // Try to match tracks to storms
        data.features.forEach(f => {
          if (f.geometry?.paths) {
            const name = f.attributes?.STORMNAME;
            const storm = activeStorms.find(s => s.name === name);
            if (storm) {
              storm.forecastTrack = f.geometry.paths[0]?.map(p => [p[1], p[0]]) || [];
            }
          }
        });
      }
    } catch (e) {
      // Non-critical
    }

    // Try cone of uncertainty
    try {
      const url = `${CONFIG.nhc.gisService}/NHC_Atl_trop_cyclones_active/MapServer/1/query?where=1%3D1&outFields=*&f=json&returnGeometry=true`;
      const data = await safeFetch(url);

      if (data?.features?.length) {
        data.features.forEach(f => {
          if (f.geometry?.rings) {
            const name = f.attributes?.STORMNAME;
            const storm = activeStorms.find(s => s.name === name);
            if (storm) {
              storm.cone = f.geometry.rings[0]?.map(p => [p[1], p[0]]) || [];
            }
          }
        });
      }
    } catch (e) {
      // Non-critical
    }
  }

  function updateStormDisplay() {
    // Storm count badge
    const badge = document.getElementById('storm-count-badge');
    if (badge) {
      badge.textContent = activeStorms.length;
      badge.classList.toggle('active', activeStorms.length > 0);
    }

    // Storm list
    const list = document.getElementById('storm-list');
    if (!list) return;

    if (activeStorms.length === 0) {
      list.innerHTML = '<div class="empty-state">No active tropical systems</div>';
      return;
    }

    list.innerHTML = activeStorms.map(s => {
      const cat = RadarMap.getCategory(s.maxWind);
      return `<div class="storm-item">
        <div class="storm-cat-dot" style="color:${cat.color};background:${cat.color}"></div>
        <div style="flex:1;min-width:0">
          <div class="storm-name">${s.name}</div>
          <div class="storm-status">${cat.label}</div>
        </div>
        <div style="text-align:right">
          <div class="storm-wind">${s.maxWind} mph</div>
          <div style="font-size:9px;color:var(--text-4)">${s.pressure ? s.pressure + ' mb' : ''}</div>
        </div>
      </div>`;
    }).join('');

    // Update ticker with storm info
    if (typeof Ticker !== 'undefined' && Ticker.setStorms) {
      Ticker.setStorms(activeStorms);
    }
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function truncate(s, n) {
    return s && s.length > n ? s.substring(0, n) + '...' : (s || '');
  }

  function getAlerts() { return activeAlerts; }
  function getStorms() { return activeStorms; }

  function hasSevereAlerts() {
    return activeAlerts.some(a => ['Extreme', 'Severe'].includes(a.properties.severity));
  }

  function hasActiveStorms() {
    return activeStorms.length > 0;
  }

  return { init, fetchAlerts, fetchNHCStorms, getAlerts, getStorms, hasSevereAlerts, hasActiveStorms };
})();
