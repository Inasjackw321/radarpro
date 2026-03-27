/**
 * StormTracker Pro - Ticker Module
 * Scrolling bottom ticker with alerts, storm info, and weather data
 */
const Ticker = (() => {
  let alertItems = [];
  let stormItems = [];
  let el = null;
  const SEP = '◆';

  function init() {
    el = document.getElementById('ticker-scroll');
    render();
  }

  function setAlerts(items) {
    alertItems = items || [];
    render();
  }

  function setStorms(storms) {
    stormItems = (storms || []).map(s => {
      const cat = RadarMap.getCategory(s.maxWind);
      return {
        text: `🌀 ${cat.label} ${s.name} — ${s.maxWind} mph winds${s.pressure ? ' · ' + s.pressure + ' mb' : ''}${s.movement ? ' · Moving ' + s.movement : ''}`,
        isStorm: true
      };
    });
    render();
  }

  function render() {
    if (!el) return;
    const items = buildItems();

    if (items.length === 0) {
      const def = `${CONFIG.branding.stationName} ${CONFIG.branding.callSign} ${SEP} ${CONFIG.branding.tagline} ${SEP} ${CONFIG.location.name} ${SEP} ${CONFIG.region} ${SEP} Powered by NWS, NHC & GOES Satellite`;
      const html = `<span class="ticker-item">${def}</span>`;
      el.innerHTML = html + html;
      setDuration(def.length);
      return;
    }

    let html = items.map(item => {
      let cls = 'ticker-item';
      if (item.severity) {
        cls += ' alert-ticker';
        if (item.severity === 'Extreme') cls += ' extreme';
        if (item.event?.toLowerCase().includes('hurricane')) cls += ' hurricane';
      }
      if (item.isStorm) cls += ' alert-ticker hurricane';
      return `<span class="${cls}">${item.text}</span><span class="ticker-sep">${SEP}</span>`;
    }).join('');

    // Brand bookend
    html += `<span class="ticker-item">${CONFIG.branding.stationName} ${CONFIG.branding.callSign} — ${CONFIG.branding.tagline}</span><span class="ticker-sep">${SEP}</span>`;

    // Duplicate for seamless loop
    el.innerHTML = html + html;

    const chars = items.reduce((s, i) => s + i.text.length, 0) + 50;
    setDuration(chars);
  }

  function buildItems() {
    const items = [];

    // Storm items first (highest priority)
    stormItems.forEach(s => items.push(s));

    // Alert items
    alertItems.forEach(a => items.push(a));

    // Default filler if nothing
    if (items.length === 0) {
      const now = new Date();
      const t = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      items.push({ text: `${t} — No active tropical systems or severe weather for ${CONFIG.state}` });
      items.push({ text: `${CONFIG.location.name} — ${CONFIG.region} — Live hurricane & weather tracking` });
    }

    return items;
  }

  function setDuration(chars) {
    const dur = Math.max(18, (chars * 7) / 85);
    const rail = document.querySelector('.ticker-rail');
    if (rail) rail.style.setProperty('--ticker-dur', `${dur}s`);
    if (el) el.style.animationDuration = `${dur}s`;
  }

  return { init, setAlerts, setStorms };
})();
