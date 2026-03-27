/**
 * RadarPro - Alerts Module
 * NWS weather alerts polling, banner display, severity mapping
 */
const AlertSystem = (() => {
  let activeAlerts = [];
  let bannerRotationIdx = 0;
  let bannerTimer = null;
  let lastAlertHash = '';

  async function init() {
    await fetchAlerts();
    setInterval(() => fetchAlerts(), CONFIG.refreshIntervals.alerts);
    // Rotate banner alerts every 8 seconds
    bannerTimer = setInterval(() => rotateBanner(), 8000);
  }

  async function fetchAlerts() {
    const data = await safeFetch(
      `https://api.weather.gov/alerts/active?area=${CONFIG.state}`
    );
    if (!data || !data.features) return;

    const now = new Date();

    // Filter unexpired, deduplicate
    const seen = new Set();
    activeAlerts = data.features
      .filter(f => {
        const expires = new Date(f.properties.expires);
        return expires > now;
      })
      .filter(f => {
        const key = f.properties.event + '|' + (f.properties.areaDesc || '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const order = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
        return (order[a.properties.severity] ?? 4) - (order[b.properties.severity] ?? 4);
      });

    // Check if alerts changed
    const newHash = activeAlerts.map(a => a.properties.id).join(',');
    if (newHash === lastAlertHash) return;
    lastAlertHash = newHash;

    updateDisplay();
    updateTicker();
    drawMapPolygons();
  }

  function updateDisplay() {
    // Update alert count
    const countEl = document.getElementById('alert-count');
    if (countEl) {
      countEl.textContent = activeAlerts.length;
      countEl.classList.toggle('has-alerts', activeAlerts.length > 0);
    }

    // Update sidebar alert list
    const listEl = document.getElementById('alert-list');
    if (listEl) {
      if (activeAlerts.length === 0) {
        listEl.innerHTML = '<div class="no-alerts">No active alerts</div>';
      } else {
        listEl.innerHTML = activeAlerts.slice(0, 5).map(a => {
          const p = a.properties;
          return `
            <div class="alert-item severity-${p.severity}">
              <strong>${p.event}</strong><br>
              <span style="font-size:10px;opacity:0.7">${truncate(p.areaDesc, 60)}</span>
            </div>
          `;
        }).join('');
      }
    }

    // Update banner
    bannerRotationIdx = 0;
    showBannerAlert();
  }

  function showBannerAlert() {
    const banner = document.getElementById('alert-banner');
    if (!banner) return;

    // Only show banner for Extreme or Severe alerts
    const severeAlerts = activeAlerts.filter(a =>
      ['Extreme', 'Severe'].includes(a.properties.severity)
    );

    if (severeAlerts.length === 0) {
      banner.classList.add('hidden');
      return;
    }

    const alert = severeAlerts[bannerRotationIdx % severeAlerts.length];
    const p = alert.properties;
    const severityClass = CONFIG.alertColors[p.severity]?.class || 'alert-unknown';

    banner.className = `alert-banner ${severityClass}`;
    banner.setAttribute('data-event', p.event);

    const eventEl = document.getElementById('alert-event');
    const headlineEl = document.getElementById('alert-headline');
    const badgeEl = document.getElementById('alert-count-badge');

    if (eventEl) eventEl.textContent = p.event;
    if (headlineEl) headlineEl.textContent = p.headline || p.areaDesc || '';
    if (badgeEl && severeAlerts.length > 1) {
      badgeEl.textContent = `${(bannerRotationIdx % severeAlerts.length) + 1}/${severeAlerts.length}`;
    }
  }

  function rotateBanner() {
    const severeAlerts = activeAlerts.filter(a =>
      ['Extreme', 'Severe'].includes(a.properties.severity)
    );
    if (severeAlerts.length <= 1) return;

    bannerRotationIdx++;
    showBannerAlert();
  }

  function updateTicker() {
    if (typeof Ticker !== 'undefined' && Ticker.setAlerts) {
      const items = activeAlerts.map(a => ({
        text: `${a.properties.event}: ${a.properties.headline || a.properties.areaDesc}`,
        severity: a.properties.severity
      }));
      Ticker.setAlerts(items);
    }
  }

  function drawMapPolygons() {
    if (typeof RadarMap !== 'undefined' && RadarMap.drawAlertPolygons) {
      RadarMap.drawAlertPolygons(activeAlerts);
    }
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  function getAlerts() {
    return activeAlerts;
  }

  function hasSevereAlerts() {
    return activeAlerts.some(a =>
      ['Extreme', 'Severe'].includes(a.properties.severity)
    );
  }

  return { init, fetchAlerts, getAlerts, hasSevereAlerts };
})();
