/**
 * StormTracker Pro GLOBAL — Ticker
 */
const Ticker = (() => {
  let alertItems = [];
  let stormItems = [];
  let el = null;
  const S = '◆';

  function init() {
    el = document.getElementById('tick-scroll');
    render();
  }

  function setAlerts(items) { alertItems = items || []; render(); }

  function setStorms(storms) {
    stormItems = (storms || []).map(s => {
      const cat = RadarMap.getCategory(s.maxWind);
      return {
        text: `${cat.label} ${s.name} — ${s.maxWind || '?'} mph${s.pressure ? ' · ' + s.pressure + ' mb' : ''} — ${s.basin}${s.movement ? ' · ' + s.movement : ''}`,
        isStorm: true
      };
    });
    render();
  }

  function render() {
    if (!el) return;
    const items = [];

    stormItems.forEach(s => items.push(s));
    alertItems.forEach(a => items.push(a));

    if (!items.length) {
      const loc = CONFIG.locations[CONFIG.activeLocationIdx];
      const def = `${CONFIG.branding.stationName} ${CONFIG.branding.callSign} ${S} ${CONFIG.branding.tagline} ${S} Monitoring all basins: Atlantic · E. Pacific · W. Pacific · Indian · S. Pacific ${S} ${loc?.name || ''} ${S} Powered by NHC, GOES, Himawari, Meteosat & Open-Meteo`;
      el.innerHTML = `<span class="tk">${def}</span>` + `<span class="tk">${def}</span>`;
      setDur(def.length);
      return;
    }

    let html = items.map(i => {
      let c = 'tk';
      if (i.severity) { c += ' alert-tk'; if (i.severity === 'Extreme') c += ' extreme'; }
      if (i.isStorm) c += ' storm-tk';
      return `<span class="${c}">${i.text}</span><span class="tk-sep">${S}</span>`;
    }).join('');

    html += `<span class="tk">${CONFIG.branding.stationName} ${CONFIG.branding.callSign} — ${CONFIG.branding.tagline}</span><span class="tk-sep">${S}</span>`;
    el.innerHTML = html + html;
    setDur(items.reduce((s, i) => s + i.text.length, 0) + 50);
  }

  function setDur(chars) {
    const d = Math.max(20, (chars * 7) / 90);
    const rail = document.querySelector('.tick-rail');
    if (rail) rail.style.setProperty('--tick-dur', `${d}s`);
    if (el) el.style.animationDuration = `${d}s`;
  }

  return { init, setAlerts, setStorms };
})();
